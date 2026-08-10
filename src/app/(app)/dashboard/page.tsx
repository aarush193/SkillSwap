"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, List, Clock, PlusCircle, Activity } from 'lucide-react';
import type { Metadata } from 'next';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchUserProfile, updateAllZeroBalancesToDefault } from '@/lib/profile-service';
import type { UserProfile } from '@/types/skillswap';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<Error | null>(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
        setProfileError(error);
        return;
      }
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const [activeListingsCount, setActiveListingsCount] = useState<number>(0);

  useEffect(() => {
    if (user) {
      setProfileLoading(true);

      // Fetch user profile and user's active listings count in parallel
      Promise.all([
        updateAllZeroBalancesToDefault()
          .then(() => fetchUserProfile(user.id)),
        supabase
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
      ])
        .then(([profileData, listingsRes]) => {
          setProfile(profileData);
          if (listingsRes.count !== null) {
            setActiveListingsCount(listingsRes.count);
          }
          setProfileLoading(false);
        })
        .catch(err => {
          console.error("Error loading dashboard data:", err);
          setProfileError(err);
          setProfileLoading(false);
        });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Please Sign In</h2>
          <p className="text-muted-foreground">You need to be signed in to view your dashboard.</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-lg">Loading your dashboard...</span>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Error Loading Profile</h2>
          <p className="text-muted-foreground">{profileError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome back, {profile ? profile.name : 'User'}!
        </h1>
        <Button asChild>
          <Link href="/listings/create">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Listing
          </Link>
        </Button>
      </div>

      {/* Quick Stats Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Time Balance</CardTitle>
            <Clock className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {profile?.timeBalance !== undefined ? profile.timeBalance.toFixed(1) : '0.0'} hours
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your live time credit balance from your profile.
            </p>
            {profile?.timeAvailable && (
              <div className="mt-2">
                <p className="text-sm font-medium">Available Times:</p>
                <p className="text-sm text-muted-foreground">{profile.timeAvailable}</p>
              </div>
            )}
            <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
              <p>• Use these hours to request skills</p>
              <p>• Earn hours by offering your expertise</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Active Listings</CardTitle>
            <List className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {activeListingsCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Skills you are actively offering or requesting in the community.
            </p>
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/listings">View My Listings</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Navigate to key areas of SkillSwap.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" asChild className="h-auto py-4 flex flex-col items-center gap-2">
            <Link href="/profile" className="flex flex-col items-center text-center">
              <User className="h-8 w-8 mb-2 text-primary" />
              <span className="font-semibold">View Profile</span>
              <span className="text-xs text-muted-foreground">Update your skills & info</span>
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-auto py-4 flex flex-col items-center gap-2">
            <Link href="/listings" className="flex flex-col items-center text-center">
              <List className="h-8 w-8 mb-2 text-primary" />
              <span className="font-semibold">Browse Listings</span>
              <span className="text-xs text-muted-foreground">Find skills or offer yours</span>
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-auto py-4 flex flex-col items-center gap-2">
            <Link href="/timebank" className="flex flex-col items-center text-center">
              <Clock className="h-8 w-8 mb-2 text-primary" />
              <span className="font-semibold">Manage Time Bank</span>
              <span className="text-xs text-muted-foreground">Log hours & view balance</span>
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-auto py-4 flex flex-col items-center gap-2">
            <Link href="/listings/create" className="flex flex-col items-center text-center">
              <PlusCircle className="h-8 w-8 mb-2 text-accent" />
              <span className="font-semibold text-accent">Post a New Skill</span>
              <span className="text-xs text-muted-foreground">Offer or request a skill</span>
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest time transactions and listing updates.</CardDescription>
        </CardHeader>
        <CardContent>
          {false ? (
            <ul className="space-y-3">
              {/* No real recentActivity in UserProfile, so this is hidden for now */}
            </ul>
          ) : (
            <p className="text-muted-foreground">No recent activity to display.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
