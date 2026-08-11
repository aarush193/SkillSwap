"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchUserProfile } from "@/lib/profile-service";
import type { UserProfile } from "@/types/skillswap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Repeat, CheckCircle2, XCircle, Clock, Loader2, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface ExchangeRecord {
  id: string;
  listing_id: string;
  requester_id: string;
  provider_id: string;
  skill_name: string;
  hours: number;
  status: "requested" | "accepted" | "cancelled" | "completed";
  created_at: string;
  completed_at?: string;
  // Optional populated profiles
  requester_name?: string;
  provider_name?: string;
  listing_title?: string;
}

export default function ExchangesPage() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [exchanges, setExchanges] = useState<ExchangeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchExchanges = async (userId: string) => {
    try {
      // Query exchanges with joined requester profile, provider profile, and listing title
      const { data, error } = await supabase
        .from("exchanges")
        .select(`
          *,
          requester:profiles!exchanges_requester_id_fkey(id, name),
          provider:profiles!exchanges_provider_id_fkey(id, name),
          listing:listings!exchanges_listing_id_fkey(id, title)
        `)
        .or(`requester_id.eq.${userId},provider_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading exchanges:", error);
        toast({
          title: "Error Loading Exchanges",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      const rawExchanges = data || [];

      const enriched = rawExchanges.map((e: any) => {
        const reqProfile = Array.isArray(e.requester) ? e.requester[0] : e.requester;
        const provProfile = Array.isArray(e.provider) ? e.provider[0] : e.provider;
        const lst = Array.isArray(e.listing) ? e.listing[0] : e.listing;

        return {
          ...e,
          requester_name: reqProfile?.name || "Community Member",
          provider_name: provProfile?.name || "Community Member",
          listing_title: lst?.title || "Skill Listing",
        };
      });

      setExchanges(enriched);
    } catch (err: any) {
      console.error("Unexpected error fetching exchanges:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        await fetchExchanges(user.id);
      } else {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleUpdateStatus = async (exchangeId: string, newStatus: "accepted" | "cancelled") => {
    setUpdatingId(exchangeId);
    try {
      const { error } = await supabase
        .from("exchanges")
        .update({ status: newStatus })
        .eq("id", exchangeId);

      if (error) {
        console.error("Failed to update exchange status:", error);
        toast({
          title: "Update Failed",
          description: error.message || "Could not update status.",
          variant: "destructive",
        });
      } else {
        toast({
          title: newStatus === "accepted" ? "Exchange Accepted!" : "Exchange Cancelled",
          description: `The request status has been updated to ${newStatus}.`,
        });
        setExchanges((prev) =>
          prev.map((item) => (item.id === exchangeId ? { ...item, status: newStatus } : item))
        );
      }
    } catch (err: any) {
      console.error("Error updating status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-muted-foreground font-medium">Loading Exchanges...</span>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <Repeat className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-2xl font-bold">Sign In Required</h2>
        <p className="text-muted-foreground">Please sign in to view and manage your skill exchanges.</p>
        <Button asChild className="mt-4">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  const incomingRequests = exchanges.filter(
    (e) => e.provider_id === currentUser.id && e.status === "requested"
  );
  const outgoingRequests = exchanges.filter(
    (e) => e.requester_id === currentUser.id && e.status === "requested"
  );
  const acceptedExchanges = exchanges.filter((e) => e.status === "accepted");
  const cancelledExchanges = exchanges.filter((e) => e.status === "cancelled");

  const renderExchangeCard = (item: ExchangeRecord) => {
    const isProvider = item.provider_id === currentUser.id;
    const partnerName = isProvider ? item.requester_name : item.provider_name;
    const isUpdating = updatingId === item.id;

    return (
      <Card key={item.id} className="border border-border/60 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={`https://picsum.photos/seed/${partnerName}/50/50`} />
              <AvatarFallback className="text-xs font-semibold">
                {(partnerName || "U").substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold">
                  {isProvider ? `From: ${partnerName}` : `To: ${partnerName}`}
                </CardTitle>
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  {isProvider ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <ArrowDownLeft className="h-3 w-3" /> Incoming
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                      <ArrowUpRight className="h-3 w-3" /> Sent
                    </span>
                  )}
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Target Listing: <span className="font-medium text-foreground">{item.listing_title}</span>
              </CardDescription>
            </div>
          </div>

          <Badge
            variant={
              item.status === "accepted"
                ? "default"
                : item.status === "cancelled"
                ? "destructive"
                : "secondary"
            }
            className="capitalize text-xs font-semibold px-2.5 py-0.5"
          >
            {item.status}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-2 py-2">
          <div className="p-3 rounded-lg bg-muted/40 border border-border/50 text-xs space-y-1">
            <p>
              <span className="font-semibold text-foreground">Skill Requested / Offered:</span> {item.skill_name}
            </p>
            <p>
              <span className="font-semibold text-foreground">Proposed Hours:</span> {item.hours} hrs
            </p>
            <p className="text-[11px] text-muted-foreground pt-1">
              Requested {item.created_at ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true }) : "recently"}
            </p>
          </div>
        </CardContent>

        {/* Action Controls for Provider */}
        {isProvider && item.status === "requested" && (
          <CardFooter className="pt-2 border-t border-border/40 flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs text-destructive hover:bg-destructive/10"
              onClick={() => handleUpdateStatus(item.id, "cancelled")}
              disabled={isUpdating}
            >
              <XCircle className="mr-1.5 h-3.5 w-3.5" /> Decline
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              onClick={() => handleUpdateStatus(item.id, "accepted")}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
              Accept Proposal
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Repeat className="h-8 w-8 text-primary" /> Skill Exchanges
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your incoming and outgoing skill exchange agreements.
          </p>
        </div>
      </div>

      <Tabs defaultValue="incoming" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-10">
          <TabsTrigger value="incoming" className="py-2 text-xs font-medium">
            Incoming ({incomingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="py-2 text-xs font-medium">
            Sent ({outgoingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="accepted" className="py-2 text-xs font-medium">
            Accepted ({acceptedExchanges.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="py-2 text-xs font-medium">
            Declined ({cancelledExchanges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="space-y-4">
          {incomingRequests.length > 0 ? (
            incomingRequests.map(renderExchangeCard)
          ) : (
            <div className="text-center py-12 px-4 border border-dashed border-border/80 rounded-xl bg-card/40 space-y-2">
              <p className="text-sm font-semibold text-foreground">No Incoming Requests</p>
              <p className="text-xs text-muted-foreground">When other members propose a skill exchange on your listings, they will appear here.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {outgoingRequests.length > 0 ? (
            outgoingRequests.map(renderExchangeCard)
          ) : (
            <div className="text-center py-12 px-4 border border-dashed border-border/80 rounded-xl bg-card/40 space-y-2">
              <p className="text-sm font-semibold text-foreground">No Sent Requests</p>
              <p className="text-xs text-muted-foreground">You haven't proposed any skill exchanges yet.</p>
              <Button asChild size="sm" className="mt-2 text-xs">
                <Link href="/listings">Browse Listings</Link>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="accepted" className="space-y-4">
          {acceptedExchanges.length > 0 ? (
            acceptedExchanges.map(renderExchangeCard)
          ) : (
            <div className="text-center py-12 px-4 border border-dashed border-border/80 rounded-xl bg-card/40 space-y-2">
              <p className="text-sm font-semibold text-foreground">No Accepted Exchanges Yet</p>
              <p className="text-xs text-muted-foreground">Confirmed skill exchange agreements will be listed here.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          {cancelledExchanges.length > 0 ? (
            cancelledExchanges.map(renderExchangeCard)
          ) : (
            <div className="text-center py-12 px-4 border border-dashed border-border/80 rounded-xl bg-card/40 space-y-2">
              <p className="text-sm font-semibold text-foreground">No Declined Requests</p>
              <p className="text-xs text-muted-foreground">Declined or cancelled requests will appear here.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
