"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchUserProfile } from "@/lib/profile-service";
import type { UserProfile } from "@/types/skillswap";
import { TimeBalanceDisplay } from "@/components/timebank/time-balance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Clock, ListChecks, Hourglass, Loader2, Info, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function TimeBankPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const userProfile = await fetchUserProfile(user.id);
          setProfile(userProfile);
        }
      } catch (err) {
        console.error("Error fetching profile for Time Bank:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-muted-foreground font-medium">Loading Time Bank...</span>
      </div>
    );
  }

  const INITIAL_BALANCE = 12.0;
  const currentBalance = profile?.timeBalance ?? INITIAL_BALANCE;
  const totalSpent = Math.max(0, INITIAL_BALANCE - currentBalance);
  const totalCredited = INITIAL_BALANCE + Math.max(0, currentBalance - INITIAL_BALANCE);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Hourglass className="h-8 w-8 text-primary" /> Time Bank Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your time credit balance and view logged skill exchanges.
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-10">
          <TabsTrigger value="overview" className="py-2">Overview & Balance</TabsTrigger>
          <TabsTrigger value="history" className="py-2">Exchange History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <TimeBalanceDisplay 
            currentBalance={currentBalance}
            totalCredited={totalCredited}
            totalSpent={totalSpent}
          />
        </TabsContent>

        <TabsContent value="history">
          <Card className="shadow-lg border border-border/60">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <ListChecks className="h-6 w-6 text-primary" /> Completed Exchange History
              </CardTitle>
              <CardDescription>
                A record of all your verified skill exchange transactions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 px-4 border border-dashed border-border/80 rounded-xl bg-card/40 space-y-4">
                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                  <Info className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-base font-bold text-foreground">No Completed Exchanges Yet</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Completed skill exchanges and time transfers will appear here in a future update once verified by both participants.
                  </p>
                </div>
                <div className="pt-2">
                  <Button asChild size="sm">
                    <Link href="/listings" className="flex items-center gap-1.5">
                      Browse Community Listings <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

