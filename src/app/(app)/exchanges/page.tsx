"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { fetchUserProfile } from "@/lib/profile-service";
import { 
  fetchUserExchanges, 
  acceptExchange, 
  rejectExchange, 
  cancelExchange, 
  confirmAndSettleExchange 
} from "@/lib/exchange-service";
import { fetchSessionsForExchanges, updateSessionStatus } from "@/lib/session-service";
import { SessionDialog } from "@/components/sessions/session-dialog";
import type { UserProfile, ExchangeRecord } from "@/types/skillswap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Repeat, CheckCircle2, XCircle, Clock, Loader2, ArrowUpRight, ArrowDownLeft, ShieldCheck, Hourglass, Calendar, Video, ExternalLink, Edit3 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function ExchangesPage() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [exchanges, setExchanges] = useState<ExchangeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Session dialog state
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [selectedExchangeForSession, setSelectedExchangeForSession] = useState<ExchangeRecord | null>(null);

  const loadData = useCallback(async (userId: string) => {
    try {
      const [exchangesRes, profileRes] = await Promise.all([
        fetchUserExchanges(userId),
        fetchUserProfile(userId),
      ]);

      if (exchangesRes.error) {
        toast({
          title: "Error Loading Exchanges",
          description: exchangesRes.error.message,
          variant: "destructive",
        });
      } else {
        const rawExchanges = exchangesRes.data || [];
        if (rawExchanges.length > 0) {
          const exchangeIds = rawExchanges.map((e) => e.id);
          const sessionMap = await fetchSessionsForExchanges(exchangeIds);
          const enriched = rawExchanges.map((e) => ({
            ...e,
            session: sessionMap[e.id] || null,
          }));
          setExchanges(enriched);
        } else {
          setExchanges([]);
        }
      }

      if (profileRes) {
        setUserProfile(profileRes);
      }
    } catch (err: any) {
      console.error("Unexpected error loading exchange dashboard:", err);
    }
  }, [toast]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        await loadData(user.id);
      }
      setLoading(false);
    }
    init();
  }, [loadData]);

  // Action 1: Provider Accepts Request
  const handleAccept = async (exchangeId: string) => {
    setUpdatingId(exchangeId);
    try {
      const { success, error } = await acceptExchange(exchangeId);
      if (error) {
        toast({
          title: "Acceptance Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Proposal Accepted!",
          description: "Hours have been reserved on the requester's profile. You can now coordinate and complete the exchange.",
        });
        if (currentUser) await loadData(currentUser.id);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // Action 2: Provider Rejects Request
  const handleReject = async (exchangeId: string) => {
    setUpdatingId(exchangeId);
    try {
      const { success, error } = await rejectExchange(exchangeId);
      if (error) {
        toast({
          title: "Recline Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Proposal Declined",
          description: "The exchange request has been marked as declined.",
        });
        if (currentUser) await loadData(currentUser.id);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // Action 3: Participant Cancels Exchange
  const handleCancel = async (exchangeId: string) => {
    setUpdatingId(exchangeId);
    try {
      const targetExchange = exchanges.find((e) => e.id === exchangeId);
      const { success, error } = await cancelExchange(exchangeId);
      if (error) {
        toast({
          title: "Cancellation Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        if (targetExchange?.session?.id) {
          await updateSessionStatus(targetExchange.session.id, "cancelled");
        }
        toast({
          title: "Exchange Cancelled",
          description: "The exchange has been cancelled and any reserved hours have been released.",
        });
        if (currentUser) await loadData(currentUser.id);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // Action 4: Participant Confirms Completion (Two-Party Confirmation & Time Bank Settlement)
  const handleConfirmCompletion = async (exchangeId: string) => {
    setUpdatingId(exchangeId);
    try {
      const targetExchange = exchanges.find((e) => e.id === exchangeId);
      const { data, error } = await confirmAndSettleExchange(exchangeId);
      if (error) {
        toast({
          title: "Confirmation Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (data?.settled) {
        if (targetExchange?.session?.id) {
          await updateSessionStatus(targetExchange.session.id, "completed");
        }
        toast({
          title: "🎉 Exchange Settled & Completed!",
          description: "Both participants confirmed! Time Bank hours have been successfully transferred and logged to the ledger.",
        });
        if (currentUser) await loadData(currentUser.id);
      } else {
        toast({
          title: "Confirmation Recorded",
          description: "Your confirmation was recorded. Waiting for your exchange partner to confirm completion.",
        });
        if (currentUser) await loadData(currentUser.id);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const openScheduleModal = (item: ExchangeRecord) => {
    setSelectedExchangeForSession(item);
    setSessionDialogOpen(true);
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
  const activeExchanges = exchanges.filter((e) => e.status === "accepted");
  const completedExchanges = exchanges.filter((e) => e.status === "completed");
  const historyExchanges = exchanges.filter(
    (e) => e.status === "completed" || e.status === "rejected" || e.status === "cancelled"
  );

  const renderExchangeCard = (item: ExchangeRecord) => {
    const isProvider = item.provider_id === currentUser.id;
    const isRequester = item.requester_id === currentUser.id;
    const partnerName = isProvider ? item.requester_name : item.provider_name;
    const isUpdating = updatingId === item.id;

    // Confirmation status flags for accepted state
    const hasMyConfirmation = isRequester ? item.requester_confirmed : item.provider_confirmed;
    const hasPartnerConfirmation = isRequester ? item.provider_confirmed : item.requester_confirmed;

    return (
      <Card key={item.id} className="border border-border/60 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={`https://picsum.photos/seed/${partnerName}/50/50`} />
              <AvatarFallback className="text-xs font-semibold">
                {(partnerName || "U").substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
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
              item.status === "completed"
                ? "default"
                : item.status === "accepted"
                ? "secondary"
                : item.status === "cancelled" || item.status === "rejected"
                ? "destructive"
                : "outline"
            }
            className="capitalize text-xs font-semibold px-2.5 py-0.5 shrink-0"
          >
            {item.status}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-2 py-2">
          <div className="p-3 rounded-lg bg-muted/40 border border-border/50 text-xs space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p>
                <span className="font-semibold text-foreground">Target Skill:</span> {item.skill_name}
              </p>
              <Badge variant="outline" className="text-xs font-bold bg-primary/10 text-primary border-primary/20">
                {item.hours} hrs requested
              </Badge>
            </div>

            {/* Reserved Hours indicator for Requester in accepted state */}
            {item.status === "accepted" && isRequester && (
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 pt-1 font-medium text-[11px]">
                <Hourglass className="h-3.5 w-3.5 shrink-0" />
                {item.hours} hours are currently reserved from your available balance.
              </div>
            )}

            {/* Session Information & Management Block */}
            {item.session ? (
              <div className="pt-2.5 border-t border-border/40 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
                    <Video className="h-4 w-4 text-primary" />
                    <span>Scheduled Session</span>
                  </div>
                  <Badge
                    variant={
                      item.session.status === "completed"
                        ? "default"
                        : item.session.status === "cancelled"
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-[10px] capitalize px-2 py-0.5"
                  >
                    {item.session.status}
                  </Badge>
                </div>

                <div className="p-2.5 rounded-md bg-background/80 border border-border/60 flex items-center justify-between flex-wrap gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{item.session.scheduled_date}</span>
                      <Clock className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                      <span>{item.session.scheduled_time?.substring(0, 5)}</span>
                    </div>
                    {item.status === "accepted" && item.session.status === "scheduled" && item.session.meeting_link && (
                      <p className="text-[11px] text-muted-foreground truncate max-w-[280px]">
                        Link: <span className="font-mono">{item.session.meeting_link}</span>
                      </p>
                    )}
                  </div>

                  {item.status === "accepted" && item.session.status === "scheduled" && item.session.meeting_link && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => openScheduleModal(item)}
                      >
                        <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit Link
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm"
                        asChild
                      >
                        <a href={item.session.meeting_link} target="_blank" rel="noopener noreferrer">
                          <Video className="h-3.5 w-3.5 mr-1.5" /> Join Session <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : item.status === "accepted" ? (
              <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-3 p-2.5 rounded-md bg-primary/5 border border-primary/10">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Video className="h-4 w-4 text-primary" /> No Session Scheduled
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Schedule a date, time, and meeting link (Zoom, Meet, Discord) to begin learning.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="default"
                  className="text-xs shrink-0 font-semibold"
                  onClick={() => openScheduleModal(item)}
                >
                  <Calendar className="h-3.5 w-3.5 mr-1.5" /> Schedule Session
                </Button>
              </div>
            ) : null}

            {/* Confirmation status indicator for accepted state */}
            {item.status === "accepted" && (
              <div className="pt-2 border-t border-border/40 space-y-1 text-[11px]">
                <p className="font-semibold text-foreground">Completion Confirmations:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5">
                    {hasMyConfirmation ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span>You: {hasMyConfirmation ? "Confirmed" : "Pending"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {hasPartnerConfirmation ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span>Partner: {hasPartnerConfirmation ? "Confirmed" : "Pending"}</span>
                  </div>
                </div>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground pt-1">
              Requested {item.created_at ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true }) : "recently"}
              {item.completed_at && ` • Completed ${formatDistanceToNow(new Date(item.completed_at), { addSuffix: true })}`}
            </p>
          </div>
        </CardContent>

        {/* Action Footer Controls */}
        <CardFooter className="pt-2 border-t border-border/40 flex items-center justify-end gap-2 flex-wrap">
          {/* Requested State Actions */}
          {item.status === "requested" && isProvider && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-xs text-destructive hover:bg-destructive/10"
                onClick={() => handleReject(item.id)}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <XCircle className="mr-1.5 h-3.5 w-3.5" />}
                Decline
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                onClick={() => handleAccept(item.id)}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                Accept Proposal
              </Button>
            </>
          )}

          {item.status === "requested" && isRequester && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs text-destructive hover:bg-destructive/10"
              onClick={() => handleCancel(item.id)}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <XCircle className="mr-1.5 h-3.5 w-3.5" />}
              Cancel Request
            </Button>
          )}

          {/* Active (Accepted) State Actions */}
          {item.status === "accepted" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-xs text-muted-foreground hover:text-destructive"
                onClick={() => handleCancel(item.id)}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <XCircle className="mr-1.5 h-3.5 w-3.5" />}
                Cancel Exchange
              </Button>

              <Button
                size="sm"
                className={hasMyConfirmation ? "bg-muted text-muted-foreground text-xs" : "bg-primary text-primary-foreground text-xs font-semibold"}
                onClick={() => handleConfirmCompletion(item.id)}
                disabled={isUpdating || hasMyConfirmation}
              >
                {isUpdating ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                )}
                {hasMyConfirmation ? "Confirmed (Waiting Partner)" : "Confirm Completion"}
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header with Live Time Bank Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Repeat className="h-8 w-8 text-primary" /> Skill Exchanges
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your incoming requests, sent proposals, and active skill agreements.
          </p>
        </div>

        {/* Live Balance Card Header Widget */}
        {userProfile && (
          <div className="p-3 bg-muted/60 border border-border/80 rounded-xl flex items-center gap-4 text-xs">
            <div>
              <p className="text-muted-foreground font-medium">Total Balance</p>
              <p className="text-base font-bold text-foreground">{userProfile.timeBalance.toFixed(1)} hrs</p>
            </div>
            <div className="h-8 w-[1px] bg-border/80" />
            <div>
              <p className="text-muted-foreground font-medium">Reserved</p>
              <p className="text-base font-bold text-amber-600 dark:text-amber-400">{userProfile.reservedHours.toFixed(1)} hrs</p>
            </div>
            <div className="h-8 w-[1px] bg-border/80" />
            <div>
              <p className="text-muted-foreground font-medium">Available</p>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{userProfile.availableHours.toFixed(1)} hrs</p>
            </div>
          </div>
        )}
      </div>

      <Tabs defaultValue="incoming" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 h-10">
          <TabsTrigger value="incoming" className="py-2 text-xs font-medium">
            Incoming ({incomingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="py-2 text-xs font-medium">
            Sent ({outgoingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="py-2 text-xs font-medium">
            Active ({activeExchanges.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="py-2 text-xs font-medium">
            Completed ({completedExchanges.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="py-2 text-xs font-medium">
            History ({historyExchanges.length})
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

        <TabsContent value="active" className="space-y-4">
          {activeExchanges.length > 0 ? (
            activeExchanges.map(renderExchangeCard)
          ) : (
            <div className="text-center py-12 px-4 border border-dashed border-border/80 rounded-xl bg-card/40 space-y-2">
              <p className="text-sm font-semibold text-foreground">No Active Exchanges</p>
              <p className="text-xs text-muted-foreground">Accepted skill exchange agreements undergoing work will appear here.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedExchanges.length > 0 ? (
            completedExchanges.map(renderExchangeCard)
          ) : (
            <div className="text-center py-12 px-4 border border-dashed border-border/80 rounded-xl bg-card/40 space-y-2">
              <p className="text-sm font-semibold text-foreground">No Completed Exchanges Yet</p>
              <p className="text-xs text-muted-foreground">Verified & settled skill exchange agreements will be listed here.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {historyExchanges.length > 0 ? (
            historyExchanges.map(renderExchangeCard)
          ) : (
            <div className="text-center py-12 px-4 border border-dashed border-border/80 rounded-xl bg-card/40 space-y-2">
              <p className="text-sm font-semibold text-foreground">No Cancelled / Declined Requests</p>
              <p className="text-xs text-muted-foreground">Declined or cancelled requests will appear here.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Session Dialog Modal */}
      <SessionDialog
        open={sessionDialogOpen}
        onOpenChange={setSessionDialogOpen}
        exchange={selectedExchangeForSession}
        currentUserId={currentUser?.id || ""}
        onSessionSaved={() => {
          if (currentUser?.id) loadData(currentUser.id);
        }}
      />
    </div>
  );
}
