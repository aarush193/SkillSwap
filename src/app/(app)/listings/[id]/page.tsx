"use client";

import { useEffect, useState, use } from "react";
import type { Listing, UserProfile } from "@/types/skillswap";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarDays, Clock, Mail, MessageSquare, Tag, Info, ArrowLeft, Loader2, Sparkles, HelpCircle, Repeat, User, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { fetchUserProfile } from "@/lib/profile-service";
import { sendMessage } from "@/lib/messages-service";
import { useToast } from "@/hooks/use-toast";

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const listingId = resolvedParams.id;
  const { toast } = useToast();
  const router = useRouter();

  const [listing, setListing] = useState<Listing | null>(null);
  const [listerProfile, setListerProfile] = useState<UserProfile | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteListing = async () => {
    if (!currentUserProfile?.id || !listing?.id) return;

    if (listing.user_id !== currentUserProfile.id) {
      toast({
        title: "Permission Denied",
        description: "You can only delete your own listings.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("listings")
        .update({ status: "deleted" })
        .eq("id", listing.id)
        .eq("user_id", currentUserProfile.id);

      if (error) {
        console.error("Delete error details:", JSON.stringify(error, null, 2));
        toast({
          title: "Delete Failed",
          description: error.message || error.details || "Could not delete the listing.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Listing Deleted",
          description: "Your listing was successfully removed.",
        });
        router.push("/listings");
        router.refresh();
      }
    } catch (err: any) {
      console.error("Delete listing exception:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Proposal modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [offeredSkill, setOfferedSkill] = useState("");
  const [proposedHours, setProposedHours] = useState("1");
  const [proposalMessage, setProposalMessage] = useState("");
  const [submittingProposal, setSubmittingProposal] = useState(false);

  // Direct Message modal state
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [directMessageText, setDirectMessageText] = useState("");
  const [submittingMessage, setSubmittingMessage] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Parallelize independent operations:
        // 1. Fetching listing data (and its lister profile)
        // 2. Fetching currently logged-in user profile
        const [listingRes, authRes] = await Promise.all([
          supabase.from("listings").select("*").eq("id", listingId).single(),
          supabase.auth.getUser(),
        ]);

        const listingData = listingRes.data;

        if (listingRes.error || !listingData) {
          console.error("Error fetching listing:", listingRes.error);
          setListing(null);
        } else {
          setListing(listingData);

          // Lister profile depends on listingData.user_id
          if (listingData.user_id) {
            fetchUserProfile(listingData.user_id).then((listerProfile) => {
              setListerProfile(listerProfile);
              if (listerProfile) {
                setListing((prev) =>
                  prev
                    ? {
                        ...prev,
                        user_name: listerProfile.name || prev.user_name,
                        user_avatar_url: listerProfile.avatarUrl || prev.user_avatar_url,
                      }
                    : prev
                );
              }
            });
          }
        }

        // Fetch current user profile if authenticated
        if (authRes.data?.user) {
          const profile = await fetchUserProfile(authRes.data.user.id);
          setCurrentUserProfile(profile);
        }
      } catch (err) {
        console.error("Error in ListingDetailPage:", err);
      } finally {
        setLoading(false);
      }
    }

    if (listingId) {
      loadData();
    }
  }, [listingId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingMessage(true);

    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();

      if (userErr || !user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to send messages.",
          variant: "destructive",
        });
        setSubmittingMessage(false);
        return;
      }

      const senderId = user.id;
      const senderName = user.user_metadata?.full_name || currentUserProfile?.name || user.email || "Community Member";
      const receiverId = listing?.user_id;

      if (!receiverId) {
        toast({
          title: "Recipient Error",
          description: "Could not resolve the listing author.",
          variant: "destructive",
        });
        setSubmittingMessage(false);
        return;
      }

      const { error } = await sendMessage({
        senderId,
        receiverId,
        content: directMessageText,
        listingId,
      });

      if (error) {
        console.error("Error sending message:", JSON.stringify(error, null, 2));
        toast({
          title: "Message Failed",
          description: error.message || "Could not send in-app message.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Message Sent!",
          description: `Your message was delivered to ${listing?.user_name || "the lister"}.`,
        });
        setIsMessageModalOpen(false);
        setDirectMessageText("");
        router.push(`/messages?partner=${receiverId}`);
      }
    } catch (err: any) {
      console.error("Message error:", err);
      toast({
        title: "Error Sending Message",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setSubmittingMessage(false);
    }
  };

  const handleSendProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProposal(true);

    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();

      if (userErr || !user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to propose a skill exchange.",
          variant: "destructive",
        });
        setSubmittingProposal(false);
        return;
      }

      const senderId = user.id;
      const senderName = user.user_metadata?.full_name || currentUserProfile?.name || user.email || "Community Member";
      const receiverId = listing?.user_id;

      if (!receiverId) {
        toast({
          title: "Recipient Error",
          description: "Could not resolve the listing author.",
          variant: "destructive",
        });
        setSubmittingProposal(false);
        return;
      }

      const proposalData = {
        listing_id: listingId,
        requester_id: senderId,
        provider_id: receiverId,
        skill_name: offeredSkill,
        hours: parseFloat(proposedHours) || 1,
        status: "requested",
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("exchanges").insert([proposalData]);

      if (error) {
        console.error("Error sending proposal:", JSON.stringify(error, null, 2));
        toast({
          title: "Proposal Failed",
          description: error.message || error.details || "Could not send proposal. Check database schema.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Proposal Sent!",
          description: `Your skill exchange proposal was sent to ${listing?.user_name || "the lister"}.`,
        });
        setIsModalOpen(false);
        setOfferedSkill("");
        setProposedHours("1");
        setProposalMessage("");
      }
    } catch (err: any) {
      console.error("Proposal error:", err);
      toast({
        title: "Error Sending Proposal",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setSubmittingProposal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Loading listing details...</p>
      </div>
    );
  }

  if (!listing || listing.status === "deleted") {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Listing Unavailable</h1>
        <p className="text-muted-foreground">This skill listing has been removed or is no longer active.</p>
        <Button asChild className="mt-4">
          <Link href="/listings">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Listings
          </Link>
        </Button>
      </div>
    );
  }

  const isOffered = listing.type === "offered";
  const skillTags = [...(listing.skill_names || []), ...(listing.tags || [])];

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-6">
      <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
        <Link href="/listings">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Listings
        </Link>
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Listing Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-xl overflow-hidden border border-border/60">
            <CardHeader className="bg-muted/30 border-b pb-6 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={
                    isOffered
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-3 py-1 font-medium text-xs"
                      : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 px-3 py-1 font-medium text-xs"
                  }
                >
                  {isOffered ? (
                    <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Offering Skill</span>
                  ) : (
                    <span className="flex items-center gap-1.5"><HelpCircle className="h-3.5 w-3.5" /> Requesting Skill</span>
                  )}
                </Badge>
                {listing.category && (
                  <Badge variant="secondary" className="text-xs">{listing.category}</Badge>
                )}
                {listing.sub_category && (
                  <Badge variant="outline" className="text-xs">{listing.sub_category}</Badge>
                )}
              </div>

              <CardTitle className="text-2xl md:text-3xl font-bold leading-tight">{listing.title}</CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" /> Description
                </h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {listing.description || "No description provided."}
                </p>
              </div>

              {skillTags.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" /> Skills & Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skillTags.map((tag, idx) => (
                      <Badge key={`${tag}-${idx}`} variant="secondary" className="text-xs px-2.5 py-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" /> 
                  Posted: {listing.created_at ? format(new Date(listing.created_at), "PPP") : "Recently"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> 
                  Status: <Badge variant="outline" className="capitalize ml-1 text-xs">{listing.status || "Open"}</Badge>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lister Sidebar Info & Actions */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-xl border border-border/60">
            <CardHeader className="text-center pb-3">
              <Avatar className="mx-auto h-20 w-20 mb-3 border-2 border-primary/40 shadow-sm">
                <AvatarImage src={listing.user_avatar_url || listerProfile?.avatarUrl || `https://picsum.photos/seed/${listing.user_id || listing.user_name}/100/100`} alt={listing.user_name} />
                <AvatarFallback className="text-xl font-bold">{(listing.user_name || "U").substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl font-bold">{listing.user_name || "Community Member"}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-sm">
              {listerProfile?.bio && (
                <p className="text-xs text-muted-foreground text-center italic leading-relaxed">&quot;{listerProfile.bio}&quot;</p>
              )}

              <hr className="border-border/60" />

              <div className="space-y-2 text-xs text-muted-foreground">
                {listerProfile?.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary shrink-0" /> {listerProfile.email}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary shrink-0" /> Availability: {listerProfile?.timeAvailable || "Not specified"}
                </p>
              </div>

              {listerProfile?.skillsOffered && listerProfile.skillsOffered.length > 0 && (
                <>
                  <hr className="border-border/60" />
                  <div>
                    <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">Offered Skills:</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {listerProfile.skillsOffered.slice(0, 4).map((skill) => (
                        <Badge key={skill.id} variant="outline" className="text-xs font-normal">
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>

            {/* Option 3: Action Buttons (Owner vs Member View) */}
            <CardFooter className="flex flex-col gap-3 pt-0 pb-6 px-6">
              {currentUserProfile?.id && listing.user_id === currentUserProfile.id ? (
                <div className="w-full space-y-3 pt-2">
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-center">
                    <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 text-xs font-semibold mb-1">
                      Your Listing
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      This listing is published by you. Member requests will appear under your Exchanges.
                    </p>
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4 text-primary" /> View My Profile
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Listing
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Skill Listing</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this listing (&quot;{listing.title}&quot;)? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteListing}
                          disabled={isDeleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Delete Listing
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <>
                  {/* Action 1: Propose Skill Exchange (Modal) */}
                  <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md">
                        <Repeat className="mr-2 h-4 w-4" /> Propose Skill Exchange
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="sm:max-w-md">
                      <form onSubmit={handleSendProposal}>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Repeat className="h-5 w-5 text-primary" /> Propose Exchange with {listing.user_name}
                          </DialogTitle>
                          <DialogDescription>
                            Trade time credits for &quot;{listing.title}&quot;.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="offeredSkill">Skill You Offer in Return*</Label>
                            <Input
                              id="offeredSkill"
                              placeholder="e.g., Python Basics, Graphic Design"
                              value={offeredSkill}
                              onChange={(e) => setOfferedSkill(e.target.value)}
                              required
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="proposedHours">Hours Proposed*</Label>
                            <Input
                              id="proposedHours"
                              type="number"
                              min="0.5"
                              step="0.5"
                              placeholder="1.0"
                              value={proposedHours}
                              onChange={(e) => setProposedHours(e.target.value)}
                              required
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="proposalMessage">Note to Lister (Optional)</Label>
                            <Textarea
                              id="proposalMessage"
                              placeholder="Hi! I'd love to exchange skills. Let me know if you're available..."
                              value={proposalMessage}
                              onChange={(e) => setProposalMessage(e.target.value)}
                              className="min-h-[90px]"
                            />
                          </div>
                        </div>

                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={submittingProposal}>
                            {submittingProposal ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                              </>
                            ) : (
                              "Send Exchange Proposal"
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  {/* Action 2: In-App Direct Message */}
                  <Dialog open={isMessageModalOpen} onOpenChange={setIsMessageModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full border-border/80">
                        <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" /> Send Direct Message
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="sm:max-w-md">
                      <form onSubmit={handleSendMessage}>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" /> Message {listing.user_name}
                          </DialogTitle>
                          <DialogDescription>
                            Send an in-app message regarding &quot;{listing.title}&quot;.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="py-4">
                          <Label htmlFor="directMessage">Your Message*</Label>
                          <Textarea
                            id="directMessage"
                            placeholder={`Hi ${listing.user_name || "there"}, I saw your listing for ${listing.title} and wanted to reach out...`}
                            value={directMessageText}
                            onChange={(e) => setDirectMessageText(e.target.value)}
                            required
                            className="min-h-[120px] mt-1.5"
                          />
                        </div>

                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsMessageModalOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={submittingMessage}>
                            {submittingMessage ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                              </>
                            ) : (
                              "Send Message"
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}


