"use client";

import { useEffect, useState } from "react";
import type { UserProfile as UserProfileType, Skill, Listing } from "@/types/skillswap";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit3, Clock, Star, BookOpen, CalendarDays, Mail, Sparkles, HelpCircle, ArrowRight, PlusCircle, User, FileText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface ProfileDisplayProps {
  user: UserProfileType;
  onEdit: () => void;
}

function SkillChip({ name }: { name: string }) {
  return (
    <Badge variant="secondary" className="text-xs font-medium py-1 px-3 bg-secondary/70 hover:bg-secondary border border-border/50 transition-colors">
      {name}
    </Badge>
  );
}

export function ProfileDisplay({ user, onEdit }: ProfileDisplayProps) {
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);

  const defaultBackgroundImage = "https://picsum.photos/seed/profilebg/1200/400";

  useEffect(() => {
    async function fetchRecentListings() {
      if (!user.id) return;
      setLoadingListings(true);
      try {
        const { data, error } = await supabase
          .from("listings")
          .select("*")
          .eq("user_id", user.id)
          .neq("status", "deleted")
          .order("created_at", { ascending: false })
          .limit(3);

        if (error) {
          console.error("Error fetching user's recent listings:", error);
        } else {
          setRecentListings(data || []);
        }
      } catch (err) {
        console.error("Unexpected error fetching user listings:", err);
      } finally {
        setLoadingListings(false);
      }
    }

    fetchRecentListings();
  }, [user.id]);

  // Parse availability into tags if string is comma-separated or formatted
  const availabilityTags = user.timeAvailable
    ? user.timeAvailable.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  // Group skills by category
  const groupSkillsByCategory = (skills: Skill[]) => {
    const map: Record<string, Skill[]> = {};
    skills.forEach((skill) => {
      const cat = skill.category || "General";
      if (!map[cat]) map[cat] = [];
      map[cat].push(skill);
    });
    return map;
  };

  const groupedOffered = groupSkillsByCategory(user.skillsOffered);
  const groupedWanted = groupSkillsByCategory(user.skillsWanted);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Professional Header Section */}
      <div className="relative">
        <div 
          onClick={onEdit}
          title="Click to edit header image"
          className="w-full h-44 md:h-56 relative overflow-hidden rounded-xl border border-border/60 shadow-md cursor-pointer group"
        >
          <img
            src={user.backgroundImageUrl || defaultBackgroundImage}
            alt="Profile background"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent group-hover:bg-black/20 transition-colors" />
        </div>

        <div className="px-6 md:px-8">
          <div className="relative -mt-16 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div
                onClick={onEdit}
                title="Click to edit profile picture"
                className="cursor-pointer group relative rounded-xl overflow-hidden ring-2 ring-primary/20 hover:ring-primary transition-all"
              >
                <Avatar className="h-28 w-28 md:h-32 md:w-32 rounded-xl border-4 border-background shadow-xl">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback className="text-2xl font-bold">
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold">
                  <Edit3 className="h-5 w-5" />
                </div>
              </div>

              <div className="mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{user.name}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                  <Mail className="h-4 w-4 text-primary/70 shrink-0" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>

            {/* Time Balance Badge & Edit Action */}
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <div className="flex items-center gap-2 bg-card border border-border/80 px-3.5 py-1.5 rounded-lg shadow-sm">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <span className="text-xs text-muted-foreground block leading-none">Time Balance</span>
                  <span className="text-sm font-bold text-primary">{user.timeBalance.toFixed(1)} hrs</span>
                </div>
              </div>

              <Button onClick={onEdit} variant="outline" size="sm" className="shadow-sm">
                <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout: About & Availability */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* 2. About Section (2 cols) */}
        <Card className="md:col-span-2 shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> About Me
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.bio ? (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {user.bio}
              </p>
            ) : (
              <div className="text-center py-6 px-4 border border-dashed border-border/70 rounded-lg space-y-3 bg-muted/20">
                <User className="h-8 w-8 text-muted-foreground/60 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Introduce yourself to the community</p>
                  <p className="text-xs text-muted-foreground">
                    Add a short bio to let others know about your background and expertise.
                  </p>
                </div>
                <Button onClick={onEdit} variant="outline" size="sm" className="text-xs">
                  <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Add Bio
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 5. Availability Section (1 col) */}
        <Card className="md:col-span-1 shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" /> Availability
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availabilityTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availabilityTags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs px-2.5 py-1 font-normal bg-background">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : user.timeAvailable ? (
              <p className="text-sm text-muted-foreground">{user.timeAvailable}</p>
            ) : (
              <div className="text-center py-5 px-3 border border-dashed border-border/70 rounded-lg space-y-2 bg-muted/20">
                <CalendarDays className="h-7 w-7 text-muted-foreground/60 mx-auto" />
                <p className="text-xs text-muted-foreground">No availability schedule set yet.</p>
                <Button onClick={onEdit} variant="outline" size="sm" className="text-xs h-7 px-2.5">
                  Update Schedule
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grid Layout: Skills Offered & Currently Learning (Grouped by Category) */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 3. Skills Offered */}
        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" /> Skills Offered
            </CardTitle>
            <CardDescription className="text-xs">Overall expertise grouped by category.</CardDescription>
          </CardHeader>
          <CardContent>
            {user.skillsOffered.length > 0 ? (
              <div className="space-y-4">
                {Object.entries(groupedOffered).map(([category, skills]) => (
                  <div key={category} className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      {category}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <SkillChip key={skill.id} name={skill.name} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 px-4 border border-dashed border-border/70 rounded-lg space-y-2 bg-muted/20">
                <p className="text-xs text-muted-foreground">No skills offered added to your profile.</p>
                <Button onClick={onEdit} variant="outline" size="sm" className="text-xs h-7">
                  Add Offered Skills
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. Currently Learning */}
        <Card className="shadow-sm border-border/60">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-400" /> Currently Learning
            </CardTitle>
            <CardDescription className="text-xs">Learning goals grouped by category.</CardDescription>
          </CardHeader>
          <CardContent>
            {user.skillsWanted.length > 0 ? (
              <div className="space-y-4">
                {Object.entries(groupedWanted).map(([category, skills]) => (
                  <div key={category} className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      {category}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <SkillChip key={skill.id} name={skill.name} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 px-4 border border-dashed border-border/70 rounded-lg space-y-2 bg-muted/20">
                <p className="text-xs text-muted-foreground">No learning interests added yet.</p>
                <Button onClick={onEdit} variant="outline" size="sm" className="text-xs h-7">
                  Add Learning Goals
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 6. Recent Listings Section */}
      <Card className="shadow-sm border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> My Recent Listings
            </CardTitle>
            <CardDescription className="text-xs">Your latest active skill listings in the marketplace.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-xs">
            <Link href="/listings/create">
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Post New
            </Link>
          </Button>
        </CardHeader>

        <CardContent>
          {recentListings.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-4">
              {recentListings.map((listing) => {
                const isOffer = listing.type === "offered" || listing.type === "offer";

                return (
                  <Card key={listing.id} className="border border-border/60 shadow-none hover:border-border transition-colors flex flex-col justify-between">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Badge
                          variant="outline"
                          className={
                            isOffer
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] px-2 py-0.5"
                              : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 text-[10px] px-2 py-0.5"
                          }
                        >
                          {isOffer ? "Offering" : "Requesting"}
                        </Badge>
                        {listing.category && (
                          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                            {listing.category}
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-foreground line-clamp-1">{listing.title}</h4>
                    </CardHeader>

                    <CardFooter className="p-4 pt-2">
                      <Button variant="outline" size="sm" asChild className="w-full text-xs">
                        <Link href={`/listings/${listing.id}`}>
                          View Listing <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 px-4 border border-dashed border-border/70 rounded-lg space-y-3 bg-muted/20 max-w-md mx-auto">
              <Sparkles className="h-8 w-8 text-muted-foreground/60 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">You haven't posted any listings yet</p>
                <p className="text-xs text-muted-foreground">
                  Create a listing to offer your skills or request help from the community.
                </p>
              </div>
              <Button asChild size="sm" className="text-xs">
                <Link href="/listings/create">
                  <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Create Your First Listing
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

