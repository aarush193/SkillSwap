"use client";

import { useEffect, useState, useMemo } from "react";
import { ListingCard } from "@/components/listings/listing-card";
import type { Listing } from "@/types/skillswap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { PlusCircle, Search, X, RotateCcw, Sparkles, HelpCircle, Layers, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("recent");

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("listings")
          .select("*")
          .neq("status", "deleted")
          .order("created_at", { ascending: false });

        if (error || !data) {
          console.error("Error fetching listings:", error);
          setListings([]);
        } else {
          // Batch fetch live profiles for all listing authors
          const userIds = Array.from(new Set(data.map((item) => item.user_id).filter(Boolean)));
          
          if (userIds.length > 0) {
            const { data: profilesData } = await supabase
              .from("profiles")
              .select("id, name, avatar_url")
              .in("id", userIds);

            const profileMap = new Map((profilesData || []).map((p) => [p.id, p]));

            const enrichedListings = data.map((item) => {
              const liveProfile = profileMap.get(item.user_id);
              return {
                ...item,
                user_name: liveProfile?.name || item.user_name,
                user_avatar_url: liveProfile?.avatar_url || item.user_avatar_url,
              };
            });
            setListings(enrichedListings);
          } else {
            setListings(data);
          }
        }
      } catch (err) {
        console.error("Unexpected error fetching listings:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, []);

  const filteredListings = useMemo(() => {
    return listings
      .filter((listing) => {
        // Type filter
        if (typeFilter === "offered" && listing.type !== "offered" && listing.type !== "offer") {
          return false;
        }
        if (typeFilter === "wanted" && listing.type !== "wanted" && listing.type !== "request") {
          return false;
        }

        // Search term filter across title, description, category, user_name, skills, tags
        if (searchTerm.trim() !== "") {
          const query = searchTerm.toLowerCase().trim();
          const matchTitle = listing.title?.toLowerCase().includes(query);
          const matchDesc = listing.description?.toLowerCase().includes(query);
          const matchCat = listing.category?.toLowerCase().includes(query);
          const matchUser = listing.user_name?.toLowerCase().includes(query);
          const matchSkills = (listing.skill_names || []).some((s) => s.toLowerCase().includes(query));
          const matchTags = (listing.tags || []).some((t) => t.toLowerCase().includes(query));

          return matchTitle || matchDesc || matchCat || matchUser || matchSkills || matchTags;
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return sortOrder === "recent" ? dateB - dateA : dateA - dateB;
      });
  }, [listings, searchTerm, typeFilter, sortOrder]);

  const hasActiveFilters = searchTerm !== "" || typeFilter !== "all" || sortOrder !== "recent";

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setSortOrder("recent");
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Skill Listings</h1>
          <p className="text-muted-foreground mt-1">Discover skills offered and requested by the community.</p>
        </div>
        <Button asChild size="lg" className="shadow-md">
          <Link href="/listings/create">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Listing
          </Link>
        </Button>
      </div>

      {/* Filters and Search Section */}
      <div className="p-4 md:p-6 bg-card border border-border/60 rounded-xl shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-2 lg:col-span-3 space-y-1.5">
            <label htmlFor="search" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Search by keyword
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="e.g. 'Python', 'Graphic Design', 'Alice'..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-8 h-10 bg-background"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="type" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Listing Type
            </label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger id="type" className="h-10 bg-background">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" /> All Types
                  </span>
                </SelectItem>
                <SelectItem value="offered">
                  <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                    <Sparkles className="h-4 w-4" /> Offers Only
                  </span>
                </SelectItem>
                <SelectItem value="wanted">
                  <span className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium">
                    <HelpCircle className="h-4 w-4" /> Requests Only
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="sort" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sort by
            </label>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger id="sort" className="h-10 bg-background">
                <SelectValue placeholder="Sort Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filter Chips & Reset Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/40">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Active filters:</span>
              {searchTerm && (
                <Badge variant="secondary" className="text-xs gap-1.5 py-1">
                  Query: &quot;{searchTerm}&quot;
                  <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => setSearchTerm("")} />
                </Badge>
              )}
              {typeFilter !== "all" && (
                <Badge variant="secondary" className="text-xs gap-1.5 py-1 capitalize">
                  Type: {typeFilter}
                  <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => setTypeFilter("all")} />
                </Badge>
              )}
              {sortOrder !== "recent" && (
                <Badge variant="secondary" className="text-xs gap-1.5 py-1">
                  Oldest First
                  <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => setSortOrder("recent")} />
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground h-8"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset Filters
            </Button>
          </div>
        )}
      </div>

      {/* Metrics Bar */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-medium text-muted-foreground">
          Showing <span className="text-foreground font-bold">{filteredListings.length}</span> {filteredListings.length === 1 ? "listing" : "listings"}
        </p>
      </div>

      {/* Listings Grid or Loading / Empty States */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
          <span className="text-muted-foreground font-medium">Loading community listings...</span>
        </div>
      ) : filteredListings.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 border border-dashed border-border/80 rounded-xl bg-card/40 space-y-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Search className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">No listings found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              We couldn&apos;t find any skill listings matching your search or filters. Try adjusting your parameters.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                <RotateCcw className="mr-2 h-4 w-4" /> Reset Filters
              </Button>
            )}
            <Button asChild>
              <Link href="/listings/create">
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Listing
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

