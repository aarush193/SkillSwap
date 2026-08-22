import { supabase } from './supabase';
import type { UserProfile, Skill } from '@/types/skillswap';

const SKILL_TAXONOMY: { category: string; skills: string[] }[] = [
  {
    category: "Technology",
    skills: [
      "Frontend (React / Next.js)",
      "Backend (Node.js / Express)",
      "Python & Django",
      "Mobile App Dev (React Native / Flutter)",
      "Data Science & AI",
      "DevOps & AWS Cloud",
      "Web Security",
      "Database Admin (PostgreSQL / SQL)",
      "UI/UX Design",
    ],
  },
  {
    category: "Creative & Media",
    skills: [
      "Graphic Design & Branding",
      "Video Editing & Premiere",
      "3D Modeling & Animation",
      "Photography & Retouching",
      "Music Production & Audio",
      "Content Writing & Copywriting",
    ],
  },
  {
    category: "Business & Marketing",
    skills: [
      "SEO & Search Marketing",
      "Social Media Marketing",
      "Project Management (Agile)",
      "Business Strategy & Analytics",
      "Product Management",
      "Sales & Lead Generation",
    ],
  },
  {
    category: "Languages & Academics",
    skills: [
      "English Fluency / Writing",
      "Spanish Conversation",
      "French Language",
      "Mathematics & Calculus",
      "Physics & Engineering",
      "Public Speaking",
    ],
  },
  {
    category: "Lifestyle & Fitness",
    skills: [
      "Yoga & Mindfulness",
      "Personal Fitness Training",
      "Guitar / Piano Instruction",
      "Cooking & Culinary Arts",
      "Gardening & Plant Care",
    ],
  },
];

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    console.log("Fetching profile for user ID:", userId);
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      // Check if it's the specific error for "0 rows" with .single()
      if (profileError.code === 'PGRST116' && profileError.details?.includes("0 rows")) {
        console.log("No profile found for user:", userId);
        return null; // Profile not found, return null gracefully
      }
      if (profileError.code === 'PGRST303') {
        console.warn("Supabase JWT issued in future (PGRST303). Clearing stale authentication session...");
        await supabase.auth.signOut();
        return null;
      }
      console.error('Supabase error fetching profile:', JSON.stringify(profileError, null, 2));
      throw new Error(`Error fetching profile data: ${profileError.message}`);
    }
    
    // If profileData is null but no error, it means 0 rows were returned
    if (!profileData) {
      console.log("No profile data returned for user:", userId);
      return null;
    }
    
    console.log("Profile data from database:", profileData);
    
    // Get the skills
    const { data: skillsData, error: skillsError } = await supabase
      .from('skills')
      .select('*')
      .eq('profile_id', userId);
    
    if (skillsError) {
      console.error('Supabase error fetching skills:', JSON.stringify(skillsError, null, 2));
      throw new Error(`Error fetching skills data: ${skillsError.message}`);
    }
    
    // Helper to derive category from taxonomy lookup
    const lookupCategory = (skillName: string): string => {
      const taxonomyMatch = SKILL_TAXONOMY.find((catGroup) =>
        catGroup.skills.some((s) => s.trim().toLowerCase() === skillName.trim().toLowerCase())
      );
      return taxonomyMatch ? taxonomyMatch.category : "General";
    };

    // Transform database model to our app model
    const skillsOffered = (skillsData || [])
      .filter(skill => skill.type === 'offered')
      .map(skill => ({ id: skill.id, name: skill.name, category: skill.category || lookupCategory(skill.name) }));
    
    const skillsWanted = (skillsData || [])
      .filter(skill => skill.type === 'wanted')
      .map(skill => ({ id: skill.id, name: skill.name, category: skill.category || lookupCategory(skill.name) }));
    
    const timeBalance = typeof profileData.time_balance === 'number' ? profileData.time_balance : 12;
    const reservedHours = typeof profileData.reserved_hours === 'number' ? profileData.reserved_hours : 0;
    const availableHours = Math.max(0, timeBalance - reservedHours);
    
    const userProfile: UserProfile = {
      id: userId,
      name: profileData.name,
      email: profileData.email,
      bio: profileData.bio || '',
      avatarUrl: profileData.avatar_url || undefined,
      backgroundImageUrl: profileData.background_image_url || undefined,
      skillsOffered,
      skillsWanted,
      timeAvailable: profileData.time_available || '',
      timeBalance,
      reservedHours,
      availableHours,
    };
    
    console.log("Returning user profile with balance:", timeBalance, "reserved:", reservedHours, "available:", availableHours);
    return userProfile;
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error during profile fetch';
    console.error('Error fetching user profile:', errorMessage, error);
    throw new Error(errorMessage);
  }
}

export async function saveUserProfile(profile: Partial<UserProfile> & { id: string }): Promise<void> {
  try {
    // First, upsert the profile data
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        bio: profile.bio,
        avatar_url: profile.avatarUrl,
        background_image_url: profile.backgroundImageUrl,
        time_available: profile.timeAvailable,
        time_balance: profile.timeBalance,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });
    
    if (profileError) throw profileError;
    
    // If we have skills to update
    if (profile.skillsOffered || profile.skillsWanted) {
      // First, delete existing skills
      const { error: deleteError } = await supabase
        .from('skills')
        .delete()
        .eq('profile_id', profile.id);
      
      if (deleteError) throw deleteError;
      
      // Prepare skills for insertion
      const skillsToInsert: any[] = [];
      
      if (profile.skillsOffered) {
        const offeredSkills = profile.skillsOffered.map(skill => ({
          profile_id: profile.id,
          name: skill.name,
          type: 'offered',
        }));
        skillsToInsert.push(...offeredSkills);
      }
      
      if (profile.skillsWanted) {
        const wantedSkills = profile.skillsWanted.map(skill => ({
          profile_id: profile.id,
          name: skill.name,
          type: 'wanted',
        }));
        skillsToInsert.push(...wantedSkills);
      }
      
      // Insert the new skills
      if (skillsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('skills')
          .insert(skillsToInsert);
        
        if (insertError) throw insertError;
      }
    }
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
}

export async function createUserProfile(userId: string, initialData: Partial<UserProfile>): Promise<void> {
  try {
    const profileData = {
      id: userId,
      name: initialData.name || 'Anonymous User',
      email: initialData.email || '',
      bio: initialData.bio || '',
      background_image_url: initialData.backgroundImageUrl,
      time_available: initialData.timeAvailable || '',
      time_balance: initialData.timeBalance ?? 12,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Insert the profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert(profileData);
    
    if (profileError) throw profileError;
    
    // If we have skills to create
    const skillsToInsert: any[] = [];
      
    if (initialData.skillsOffered) {
      const offeredSkills = initialData.skillsOffered.map(skill => ({
        profile_id: userId,
        name: skill.name,
        type: 'offered',
      }));
      skillsToInsert.push(...offeredSkills);
    }
    
    if (initialData.skillsWanted) {
      const wantedSkills = initialData.skillsWanted.map(skill => ({
        profile_id: userId,
        name: skill.name,
        type: 'wanted',
      }));
      skillsToInsert.push(...wantedSkills);
    }
    
    // Insert the skills
    if (skillsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('skills')
        .insert(skillsToInsert);
      
      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

export async function updateAllZeroBalancesToDefault(): Promise<void> {
  try {
    console.log("Starting to update all zero time balances to 12 hours...");
    
    // First get all profiles with zero balance
    const { data: zeroBalanceProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, time_balance')
      .or('time_balance.eq.0,time_balance.is.null');
    
    if (fetchError) {
      console.error('Error fetching profiles with zero balances:', fetchError);
      throw fetchError;
    }
    
    console.log(`Found ${zeroBalanceProfiles.length} profiles with zero/null time balance`);
    
    if (zeroBalanceProfiles.length === 0) {
      console.log("No profiles to update.");
      return;
    }
    
    // Update all profiles with zero balance
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ time_balance: 12, updated_at: new Date().toISOString() })
      .or('time_balance.eq.0,time_balance.is.null');
    
    if (updateError) {
      console.error('Error updating profiles with zero balances:', updateError);
      throw updateError;
    }
    
    console.log(`Successfully updated ${zeroBalanceProfiles.length} profiles to have 12 hours time balance`);
  } catch (error) {
    console.error('Error updating zero time balances:', error);
    throw error;
  }
} 