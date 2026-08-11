"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  fetchConversations, 
  fetchMessageThread, 
  sendMessage, 
  markMessagesAsRead 
} from "@/lib/messages-service";
import type { DirectMessage, Conversation } from "@/types/skillswap";
import { fetchUserProfile } from "@/lib/profile-service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  Loader2, 
  Inbox, 
  Send, 
  ArrowLeft, 
  ExternalLink,
  User,
  Search
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function MessagesContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialPartnerId = searchParams.get("partner");

  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(initialPartnerId);
  const [selectedPartnerProfile, setSelectedPartnerProfile] = useState<{ id: string; name: string; avatar_url?: string } | null>(null);
  
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat thread when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 1. Load authenticated user & conversation list
  useEffect(() => {
    async function initUserAndConversations() {
      setLoadingUser(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoadingUser(false);
          setLoadingConversations(false);
          return;
        }
        setUser(user);

        // Fetch conversations using service
        setLoadingConversations(true);
        const { data, error } = await fetchConversations(user.id);
        if (error) {
          toast({
            title: "Error Loading Conversations",
            description: error.message,
            variant: "destructive",
          });
        } else {
          setConversations(data);
          
          // If query param 'partner' is supplied but not in existing conversations (e.g. new message from listing),
          // resolve partner profile so we can show empty thread ready for first message
          if (initialPartnerId && !data.some((c) => c.partner_id === initialPartnerId)) {
            const profile = await fetchUserProfile(initialPartnerId);
            if (profile) {
              setSelectedPartnerProfile({
                id: profile.id,
                name: profile.name,
                avatar_url: profile.avatarUrl,
              });
            }
          }
        }
      } catch (err: any) {
        console.error("Initialization error:", err);
      } finally {
        setLoadingUser(false);
        setLoadingConversations(false);
      }
    }

    initUserAndConversations();
  }, [initialPartnerId, toast]);

  // 2. Load message thread when selected partner changes
  useEffect(() => {
    if (!user || !selectedPartnerId) {
      setMessages([]);
      return;
    }

    async function loadThread() {
      setLoadingThread(true);
      try {
        const { data, error } = await fetchMessageThread(user.id, selectedPartnerId!);
        if (error) {
          toast({
            title: "Error Loading Thread",
            description: error.message,
            variant: "destructive",
          });
        } else {
          setMessages(data);

          // Update partner profile state if available from latest thread message
          if (data.length > 0) {
            const firstMsg = data[0];
            const partnerProfile = firstMsg.sender_id === selectedPartnerId ? firstMsg.sender_profile : firstMsg.receiver_profile;
            if (partnerProfile) {
              setSelectedPartnerProfile(partnerProfile);
            }
          } else {
            // Check if partner profile is present in conversations list
            const existingConv = conversations.find((c) => c.partner_id === selectedPartnerId);
            if (existingConv) {
              setSelectedPartnerProfile({
                id: existingConv.partner_id,
                name: existingConv.partner_name,
                avatar_url: existingConv.partner_avatar_url,
              });
            }
          }

          // Mark incoming unread messages as read
          await markMessagesAsRead(user.id, selectedPartnerId!);

          // Update local unread state in conversations list
          setConversations((prev) =>
            prev.map((c) => (c.partner_id === selectedPartnerId ? { ...c, has_unread: false } : c))
          );
        }
      } catch (err: any) {
        console.error("Error loading message thread:", err);
      } finally {
        setLoadingThread(false);
      }
    }

    loadThread();
  }, [user, selectedPartnerId, toast]);

  // 3. Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !user || !selectedPartnerId || sending) return;

    const messageContent = newMessageText.trim();
    setSending(true);

    try {
      // Find latest listing_id context if present in conversation or thread
      const recentListingId = messages.find((m) => m.listing_id)?.listing_id || 
                              conversations.find((c) => c.partner_id === selectedPartnerId)?.listing_id || 
                              null;

      const { data: newMsg, error } = await sendMessage({
        senderId: user.id,
        receiverId: selectedPartnerId,
        content: messageContent,
        listingId: recentListingId,
      });

      if (error) {
        toast({
          title: "Send Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (newMsg) {
        setNewMessageText("");
        setMessages((prev) => [...prev, newMsg]);

        // Refresh conversation list summary
        const partnerName = selectedPartnerProfile?.name || "Community Member";
        const partnerAvatar = selectedPartnerProfile?.avatar_url;

        setConversations((prev) => {
          const existingIndex = prev.findIndex((c) => c.partner_id === selectedPartnerId);
          const updatedConv: Conversation = {
            partner_id: selectedPartnerId,
            partner_name: partnerName,
            partner_avatar_url: partnerAvatar,
            latest_message_content: messageContent,
            latest_message_timestamp: newMsg.created_at,
            has_unread: false,
            listing_id: recentListingId,
          };

          if (existingIndex > -1) {
            const nextList = [...prev];
            nextList.splice(existingIndex, 1);
            return [updatedConv, ...nextList];
          } else {
            return [updatedConv, ...prev];
          }
        });
      }
    } catch (err: any) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-muted-foreground font-medium">Loading messages...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <Inbox className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-2xl font-bold">Please Sign In</h2>
        <p className="text-muted-foreground">Sign in to view and send direct messages.</p>
        <Button asChild className="mt-4">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  // Filter conversations by search term
  const filteredConversations = conversations.filter(
    (c) =>
      c.partner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.latest_message_content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Title Header */}
      <div className="border-b border-border/60 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <MessageSquare className="h-8 w-8 text-primary" /> Messages & Conversations
        </h1>
        <p className="text-muted-foreground mt-1">
          Direct 1-to-1 communication with SkillSwap community members.
        </p>
      </div>

      {/* Main Workspace Grid */}
      <Card className="grid grid-cols-1 md:grid-cols-12 min-h-[600px] max-h-[750px] border-border/60 overflow-hidden shadow-sm">
        
        {/* Left Column: Conversations List */}
        <div
          className={cn(
            "md:col-span-4 lg:col-span-4 border-r border-border/60 flex flex-col bg-muted/20",
            selectedPartnerId ? "hidden md:flex" : "flex"
          )}
        >
          {/* Search Bar */}
          <div className="p-3 border-b border-border/60">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          {/* Conversations List Scrollable */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {loadingConversations ? (
              <div className="p-8 text-center space-y-2">
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                <p className="text-xs text-muted-foreground">Loading conversations...</p>
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const isSelected = selectedPartnerId === conv.partner_id;

                return (
                  <button
                    key={conv.partner_id}
                    onClick={() => {
                      setSelectedPartnerId(conv.partner_id);
                      setSelectedPartnerProfile({
                        id: conv.partner_id,
                        name: conv.partner_name,
                        avatar_url: conv.partner_avatar_url,
                      });
                    }}
                    className={cn(
                      "w-full text-left p-3.5 transition-colors flex items-start gap-3 relative hover:bg-muted/50",
                      isSelected && "bg-muted/80 border-l-4 border-primary pl-2.5"
                    )}
                  >
                    <Avatar className="h-10 w-10 border shrink-0">
                      <AvatarImage src={conv.partner_avatar_url} alt={conv.partner_name} />
                      <AvatarFallback className="text-xs font-semibold">
                        {(conv.partner_name || "U").substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-semibold text-sm truncate text-foreground">
                          {conv.partner_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {conv.latest_message_timestamp
                            ? formatDistanceToNow(new Date(conv.latest_message_timestamp), { addSuffix: true })
                            : ""}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground truncate leading-relaxed">
                        {conv.latest_message_content}
                      </p>
                    </div>

                    {conv.has_unread && !isSelected && (
                      <span className="h-2.5 w-2.5 rounded-full bg-primary shrink-0 self-center" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center space-y-2">
                <Inbox className="h-8 w-8 text-muted-foreground mx-auto opacity-60" />
                <p className="text-xs text-muted-foreground font-medium">No conversations found.</p>
                <p className="text-[11px] text-muted-foreground">
                  Start a conversation directly from any listing.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Chat View */}
        <div
          className={cn(
            "md:col-span-8 lg:col-span-8 flex flex-col h-full bg-card",
            !selectedPartnerId ? "hidden md:flex" : "flex"
          )}
        >
          {selectedPartnerId ? (
            <>
              {/* Thread Header */}
              <div className="p-3.5 border-b border-border/60 flex items-center justify-between bg-muted/10 shrink-0">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-8 w-8"
                    onClick={() => setSelectedPartnerId(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>

                  <Avatar className="h-9 w-9 border">
                    <AvatarImage src={selectedPartnerProfile?.avatar_url} alt={selectedPartnerProfile?.name} />
                    <AvatarFallback className="text-xs font-semibold">
                      {(selectedPartnerProfile?.name || "U").substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h2 className="text-sm font-bold text-foreground">
                      {selectedPartnerProfile?.name || "Community Member"}
                    </h2>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" /> SkillSwap Member
                    </span>
                  </div>
                </div>

                {/* Listing Link context if present in recent messages */}
                {messages.find((m) => m.listing_id) && (
                  <Button variant="outline" size="sm" asChild className="text-xs h-8 gap-1 text-primary">
                    <Link href={`/listings/${messages.find((m) => m.listing_id)?.listing_id}`}>
                      <span>View Listing</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </div>

              {/* Messages Thread Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
                {loadingThread ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-2 py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Loading chat history...</span>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg) => {
                    const isOwnMessage = msg.sender_id === user.id;

                    return (
                      <div
                        key={msg.id}
                        className={cn("flex flex-col space-y-1 max-w-[80%]", isOwnMessage ? "ml-auto items-end" : "mr-auto items-start")}
                      >
                        <div
                          className={cn(
                            "px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm",
                            isOwnMessage
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-muted border border-border/60 text-foreground rounded-bl-none"
                          )}
                        >
                          {msg.content}
                        </div>

                        <div className="flex items-center gap-1.5 px-1">
                          {msg.listing_id && (
                            <Link
                              href={`/listings/${msg.listing_id}`}
                              className="text-[10px] text-primary hover:underline flex items-center gap-0.5 mr-1"
                            >
                              Listing Context <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {msg.created_at ? format(new Date(msg.created_at), "h:mm a") : ""}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-3">
                    <MessageSquare className="h-10 w-10 text-muted-foreground opacity-40" />
                    <div>
                      <h3 className="text-sm font-bold text-foreground">No messages yet</h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                        Send a message below to start the conversation with {selectedPartnerProfile?.name || "this user"}.
                      </p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-border/60 bg-card flex items-center gap-2">
                <Input
                  type="text"
                  placeholder={`Write a message to ${selectedPartnerProfile?.name || "member"}...`}
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  disabled={sending}
                  className="flex-1 text-sm h-10"
                />
                <Button type="submit" disabled={sending || !newMessageText.trim()} size="sm" className="h-10 px-4 gap-1.5">
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send</span>
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-3">
              <MessageSquare className="h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-base font-bold text-foreground">Select a Conversation</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Choose an existing thread from the left panel or initiate a message from any skill listing page.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-muted-foreground font-medium">Loading workspace...</span>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
