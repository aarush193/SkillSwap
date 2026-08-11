"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Repeat, Loader2, Inbox, ArrowRight, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface DirectMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  message?: string;
  created_at: string;
}

export default function MessagesPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox");

  useEffect(() => {
    async function loadUserAndMessages() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        setUser(user);
        setMessages([]);
      } catch (err: any) {
        console.error("Unexpected error loading messages:", err?.message || err);
      } finally {
        setLoading(false);
      }
    }

    loadUserAndMessages();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-muted-foreground font-medium">Loading your inbox...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <Inbox className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-2xl font-bold">Please Sign In</h2>
        <p className="text-muted-foreground">Sign in to view your direct messages and skill exchange proposals.</p>
        <Button asChild className="mt-4">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  const inboxMessages = messages.filter((m) => m.receiver_id === user.id);
  const sentMessages = messages.filter((m) => m.sender_id === user.id);
  const displayMessages = activeTab === "inbox" ? inboxMessages : sentMessages;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" /> Inbox & Messages
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage direct messages and skill exchange proposals from community members.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-lg border border-border/60">
          <Button
            variant={activeTab === "inbox" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("inbox")}
            className="text-xs font-semibold"
          >
            Received ({inboxMessages.length})
          </Button>
          <Button
            variant={activeTab === "sent" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("sent")}
            className="text-xs font-semibold"
          >
            Sent ({sentMessages.length})
          </Button>
        </div>
      </div>

      {/* Messages List */}
      {displayMessages.length > 0 ? (
        <div className="space-y-4">
          {displayMessages.map((msg) => {
            const isProposal = msg.offered_skill || msg.proposed_hours;

            return (
              <Card key={msg.id} className="border border-border/60 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={`https://picsum.photos/seed/${msg.sender_id || msg.sender_name}/50/50`} />
                      <AvatarFallback className="text-xs font-semibold">
                        {(msg.sender_name || "U").substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-bold">
                          {activeTab === "inbox" ? msg.sender_name || "Community Member" : `To: Lister`}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={
                            isProposal
                              ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 text-xs"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs"
                          }
                        >
                          {isProposal ? (
                            <span className="flex items-center gap-1"><Repeat className="h-3 w-3" /> Exchange Proposal</span>
                          ) : (
                            <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Direct Message</span>
                          )}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs text-muted-foreground">
                        {msg.created_at ? formatDistanceToNow(new Date(msg.created_at), { addSuffix: true }) : "Recently"}
                      </CardDescription>
                    </div>
                  </div>

                  {msg.status && (
                    <Badge variant={msg.status === "accepted" ? "default" : msg.status === "declined" ? "destructive" : "secondary"} className="capitalize text-xs">
                      {msg.status}
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Skill Exchange Proposal Specs */}
                  {isProposal && (
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/50 text-xs space-y-1.5">
                      {msg.offered_skill && (
                        <p>
                          <span className="font-semibold text-foreground">Offered Skill:</span> {msg.offered_skill}
                        </p>
                      )}
                      {msg.proposed_hours && (
                        <p>
                          <span className="font-semibold text-foreground">Proposed Hours:</span> {msg.proposed_hours} hrs
                        </p>
                      )}
                    </div>
                  )}

                  {/* Message Content */}
                  {msg.message && (
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      &quot;{msg.message}&quot;
                    </p>
                  )}

                  {/* Actions for received proposals */}
                  {activeTab === "inbox" && isProposal && msg.status === "pending" && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                        onClick={() => handleUpdateStatus(msg.id, "accepted")}
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Accept Proposal
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => handleUpdateStatus(msg.id, "declined")}
                      >
                        Decline
                      </Button>
                    </div>
                  )}

                  {msg.listing_id && (
                    <div className="pt-2">
                      <Button variant="link" asChild className="p-0 h-auto text-xs text-primary">
                        <Link href={`/listings/${msg.listing_id}`} className="flex items-center gap-1">
                          View Related Listing <ArrowRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 px-4 border border-dashed border-border/80 rounded-xl bg-card/40 space-y-3">
          <Inbox className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-bold text-foreground">No {activeTab} messages yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {activeTab === "inbox"
              ? "When other community members propose skill exchanges or send you direct messages, they will appear here."
              : "Direct messages and skill exchange proposals you send will appear here."}
          </p>
          <Button asChild className="mt-2">
            <Link href="/listings">Browse Community Listings</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
