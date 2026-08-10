import type { Listing } from "@/types/skillswap";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Tag as TagIcon, Sparkles, HelpCircle } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const isOffered = listing.type === "offered" || listing.type === "offer";
  const tags = listing.tags || [];
  const skills = listing.skill_names || [];
  const displayTags = [...skills, ...tags];

  return (
    <Card className="group flex flex-col h-full border border-border/60 bg-card hover:border-primary/40 hover:shadow-xl transition-all duration-300 overflow-hidden rounded-xl">
      <CardHeader className="pb-3 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Badge 
            variant="outline" 
            className={
              isOffered
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium px-2.5 py-0.5"
                : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 font-medium px-2.5 py-0.5"
            }
          >
            {isOffered ? (
              <span className="flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> Offering</span>
            ) : (
              <span className="flex items-center gap-1.5"><HelpCircle className="h-3 w-3" /> Requesting</span>
            )}
          </Badge>
          
          {listing.category && (
            <Badge variant="secondary" className="text-xs font-normal text-muted-foreground bg-muted/60">
              {listing.category}
            </Badge>
          )}
        </div>

        <CardTitle className="text-lg font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
          <Link href={`/listings/${listing.id}`}>
            {listing.title}
          </Link>
        </CardTitle>

        <CardDescription className="text-sm text-muted-foreground line-clamp-3 leading-relaxed min-h-[4rem]">
          {listing.description || "No description provided for this listing."}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow space-y-3 pt-0">
        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {displayTags.slice(0, 3).map((tag, idx) => (
              <Badge key={`${tag}-${idx}`} variant="outline" className="text-xs font-normal bg-background/50 border-border/80">
                <TagIcon className="mr-1 h-3 w-3 opacity-60" />
                {tag}
              </Badge>
            ))}
            {displayTags.length > 3 && (
              <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                +{displayTags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t border-border/40 pt-3 pb-4 px-6 flex flex-col gap-3 bg-muted/20">
        <div className="flex items-center space-x-3 w-full">
          <Avatar className="h-9 w-9 border border-border/80 shadow-sm">
            <AvatarImage 
              src={listing.user_avatar_url || `https://picsum.photos/seed/${listing.user_id || listing.user_name}/50/50`} 
              alt={listing.user_name || "User Avatar"} 
            />
            <AvatarFallback className="text-xs font-semibold">
              {(listing.user_name || "User").substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{listing.user_name || "Community Member"}</p>
            <p className="text-xs text-muted-foreground">
              {listing.created_at ? formatDistanceToNow(new Date(listing.created_at), { addSuffix: true }) : "Recently"}
            </p>
          </div>
        </div>

        <Button variant="outline" asChild className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-200">
          <Link href={`/listings/${listing.id}`} className="flex items-center justify-center font-medium">
            View Details 
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
