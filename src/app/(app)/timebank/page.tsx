"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchUserProfile } from "@/lib/profile-service";
import { fetchUserLedger } from "@/lib/exchange-service";
import type { UserProfile, TimeLedgerEntry } from "@/types/skillswap";
import { TimeBalanceDisplay } from "@/components/timebank/time-balance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListChecks, Hourglass, Loader2, Info, ArrowRight, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";

export default function TimeBankPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<TimeLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTimeBankData() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const [userProfile, ledgerRes] = await Promise.all([
            fetchUserProfile(user.id),
            fetchUserLedger(user.id),
          ]);
          setProfile(userProfile);
          if (ledgerRes.data) {
            setLedgerEntries(ledgerRes.data);
          }
        }
      } catch (err) {
        console.error("Error fetching Time Bank data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTimeBankData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-muted-foreground font-medium">Loading Time Bank...</span>
      </div>
    );
  }

  const currentBalance = profile?.timeBalance ?? 12.0;
  const reservedHours = profile?.reservedHours ?? 0.0;
  const availableHours = profile?.availableHours ?? currentBalance;

  // Calculate totals from immutable ledger history
  const totalCredited = ledgerEntries
    .filter((e) => e.entry_type === "exchange_credit")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const totalSpent = ledgerEntries
    .filter((e) => e.entry_type === "exchange_debit")
    .reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Hourglass className="h-8 w-8 text-primary" /> Time Bank Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your time credit balance and view your immutable audit ledger.
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-10">
          <TabsTrigger value="overview" className="py-2">Overview & Balance</TabsTrigger>
          <TabsTrigger value="history" className="py-2">
            Ledger Audit History ({ledgerEntries.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <TimeBalanceDisplay 
            currentBalance={currentBalance}
            reservedHours={reservedHours}
            availableHours={availableHours}
            totalCredited={totalCredited}
            totalSpent={totalSpent}
          />
        </TabsContent>

        <TabsContent value="history">
          <Card className="shadow-lg border border-border/60">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <ListChecks className="h-6 w-6 text-primary" /> Immutable Time Ledger Audit History
              </CardTitle>
              <CardDescription>
                A complete double-entry record of all your initial grants, earned credits, and spent debits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ledgerEntries.length > 0 ? (
                <div className="space-y-3">
                  {ledgerEntries.map((entry) => {
                    const isCredit = entry.entry_type === "exchange_credit" || entry.entry_type === "initial_grant";
                    const isGrant = entry.entry_type === "initial_grant";
                    const amountVal = Number(entry.amount);

                    return (
                      <div
                        key={entry.id}
                        className="p-4 rounded-xl border border-border/60 bg-card/60 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-2.5 rounded-full ${
                              isGrant
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : isCredit
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {isGrant ? (
                              <Sparkles className="h-5 w-5" />
                            ) : isCredit ? (
                              <TrendingUp className="h-5 w-5" />
                            ) : (
                              <TrendingDown className="h-5 w-5" />
                            )}
                          </div>

                          <div>
                            <p className="text-sm font-bold text-foreground">{entry.description}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                              <Badge variant="outline" className="capitalize text-[10px] px-1.5 py-0">
                                {entry.entry_type.replace("_", " ")}
                              </Badge>
                              <span>
                                {entry.created_at
                                  ? format(new Date(entry.created_at), "PPP p")
                                  : "Recently"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p
                            className={`text-lg font-bold ${
                              isGrant
                                ? "text-amber-600 dark:text-amber-400"
                                : isCredit
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {amountVal > 0 ? `+${amountVal.toFixed(1)}` : `${amountVal.toFixed(1)}`} hrs
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Balance after: {Number(entry.balance_after).toFixed(1)} hrs
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 px-4 border border-dashed border-border/80 rounded-xl bg-card/40 space-y-4">
                  <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                    <Info className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h3 className="text-base font-bold text-foreground">No Ledger Entries Found</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Completed skill exchanges and balance transfers will be logged here.
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
