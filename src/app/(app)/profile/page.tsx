"use client"; 

import { ProfileDisplay } from "@/components/profile/profile-display";
import type { UserProfile } from "@/types/skillswap";
import { useState, useEffect } from "react";
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase"; // Import Supabase client
import { Loader2 } from "lucide-react";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js"; // Import Supabase User type
import { useRouter } from "next/navigation";
import { fetchUserProfile, saveUserProfile, createUserProfile } from "@/lib/profile-service"; // Added import
import type { Skill } from "@/types/skillswap"; // Explicitly import Skill

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Manages overall loading for auth and initial profile
  const [isProfileLoading, setIsProfileLoading] = useState(false); // Manages profile specific loading
  const [authError, setAuthError] = useState<Error | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true); // Start with overall loading

    async function getSessionUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
            if (isMounted) setAuthError(error);
            console.error("Error fetching initial Supabase user:", error);
        } else if (user && isMounted) {
            setAuthUser(user);
        } 
      } catch (e: any) {
        if (isMounted) setAuthError(e);
        console.error("Exception fetching initial Supabase user:", e);
      } finally {
        // Initial auth check is done, but profile loading might still be pending
        // setIsLoading(false) will be handled by the profile fetching useEffect
      }
    }

    getSessionUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (isMounted) {
        const newAuthUser = session?.user ?? null;
        setAuthUser(newAuthUser);
        
        if (event === "SIGNED_OUT") {
            setCurrentUserProfile(null);
          setIsLoading(false); // No user, so loading is definitely done
        } else if (event === "SIGNED_IN" && !authUser) {
          // User signed in, profile will be fetched by the other useEffect
          // No need to set isLoading here as the other effect handles it
        }
        setAuthError(null); 
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []); // authUser dependency removed as onAuthStateChange handles updates

  useEffect(() => {
    let isMounted = true;

    async function initializeOrFetchProfile() {
      if (!authUser) {
        if (isMounted) {
          setCurrentUserProfile(null);
          setIsLoading(false); // No auth user, loading complete
        }
        return;
      }

      if (isMounted) {
        setIsProfileLoading(true); 
        if (!currentUserProfile) setIsLoading(true); 
      }

      try {
        let userProfile = await fetchUserProfile(authUser.id);
        
        if (!userProfile && isMounted) {
          // Profile not found in DB, let's create it
          console.log("No profile found for user", authUser.id, "Creating one.");
          const emptySkillArray: Skill[] = [];
          const basicProfile: UserProfile = {
            id: authUser.id,
            name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || "Anonymous User",
            email: authUser.email || "noemail@example.com",
            avatarUrl: authUser.user_metadata?.avatar_url || undefined,
            backgroundImageUrl: authUser.user_metadata?.background_image_url || undefined,
            bio: "",
            skillsOffered: emptySkillArray,
            skillsWanted: emptySkillArray,
            timeAvailable: "",
            timeBalance: 12, // Set initial time balance to 12 hours
          };

          await createUserProfile(authUser.id, basicProfile); // Create in Supabase
          toast({
            title: "Profile Created",
            description: "We've set up a basic profile for you.",
          });
        if (isMounted) {
            setCurrentUserProfile(basicProfile as UserProfile);
          }
        } else if (userProfile && isMounted) {
          setCurrentUserProfile(userProfile);
        }

      } catch (error) {
        console.error('Profile initialization/creation error:', error);
        if (isMounted) {
          toast({
            title: "Error Loading Profile",
            description: "Could not load your profile data. Please try refreshing.",
            variant: "destructive",
          });
          // Optionally, set a fallback or clear profile
           setCurrentUserProfile(null);
        }
      } finally {
        if (isMounted) {
          setIsProfileLoading(false);
          setIsLoading(false); // All loading is done
        }
      }
    }

    initializeOrFetchProfile();
    
    return () => {
        isMounted = false;
    }
  }, [authUser, toast]); // Removed currentUserProfile from deps to avoid re-fetch loops on local updates

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = async (updatedProfileData: Partial<UserProfile>) => {
    if (!authUser) {
        toast({ title: "Error", description: "You must be logged in to save your profile.", variant: "destructive" });
        return;
    }

    // Optimistic update for better UX (optional, can be removed if causing issues)
    // setCurrentUserProfile(prev => prev ? { ...prev, ...updatedProfileData, id: authUser.id } : null);

    try {
      const profileToSave: UserProfile = {
        // Ensure we have a full profile object to send to saveUserProfile
        ...(currentUserProfile || {}), // Spread existing profile or empty object
        ...updatedProfileData,        // Spread updates
        id: authUser.id,              // Ensure ID is correctly set from authUser
         // Ensure required fields like name and email are present if not in updatedProfileData
        name: updatedProfileData.name || currentUserProfile?.name || authUser.email?.split('@')[0] || "Anonymous User",
        email: updatedProfileData.email || currentUserProfile?.email || authUser.email || "",
      };
      
      await saveUserProfile(profileToSave); // Persist to Supabase

      // Fetch the updated profile from DB to ensure consistency or use returned data if service provides it
      const refreshedProfile = await fetchUserProfile(authUser.id);
      if (refreshedProfile) {
        setCurrentUserProfile(refreshedProfile);
      } else {
        // Fallback to the locally constructed one if fetch fails post-save
         setCurrentUserProfile(profileToSave);
      }
      
      // setIsEditing(false); // Dialog will close itself via its onClose prop
      // Toast for success will be shown by the EditProfileDialog
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Error Saving Profile",
        description: "Failed to save your profile to the database. Please try again.",
        variant: "destructive",
      });
      // Optional: Revert optimistic update if needed
      // const oldProfile = await fetchUserProfile(authUser.id); // Or store snapshot before optimistic update
      // if (oldProfile) setCurrentUserProfile(oldProfile);
    }
  };

  const handleCloseDialog = () => {
    setIsEditing(false);
  };

  // Combined loading state for initial auth check OR profile initialization
  if (isLoading || (authUser && isProfileLoading)) { // Show loader if overall loading or if authUser exists and profile is loading
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Authentication Error</h2>
          <p className="text-muted-foreground mb-4">{authError.message}</p>
          <button 
            onClick={() => router.push('/login')} // Redirect to login
            className="text-primary hover:underline"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!authUser) { // Check authUser from Supabase
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Please Sign In</h2>
          <p className="text-muted-foreground">You need to be signed in to view your profile.</p>
           <button 
            onClick={() => router.push('/login')} // Redirect to login
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!currentUserProfile && !isProfileLoading) { // If no profile AND not currently loading it (e.g. fetch error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Profile Not Found or Error</h2>
          <p className="text-muted-foreground">We couldn't load your profile. Please try refreshing the page or contact support if the issue persists.</p>
        </div>
      </div>
    );
  }
  
  if (!currentUserProfile && isProfileLoading) { // If no profile yet but we ARE loading it
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      {currentUserProfile && <ProfileDisplay user={currentUserProfile} onEdit={handleEdit} /> }
      
      {isEditing && currentUserProfile && (
        <EditProfileDialog
          user={currentUserProfile}
          isOpen={isEditing}
          onClose={handleCloseDialog}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
}
