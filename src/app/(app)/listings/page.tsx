import type { Metadata } from 'next';
import { ListingCard } from "@/components/listings/listing-card";
import type { Listing } from "@/types/skillswap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { PlusCircle, Search, Filter, List } from "lucide-react";
import { createClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: 'Skill Listings - SkillSwap',
  description: 'Browse and find skill offers and requests.',
};

export const revalidate = 0; // Disable cache for this page

async function getListings() {
  const supabase = await createClient();
  
  const { data: listings, error } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.log("Listings:", listings);
    console.log("Error:", error);
    return [];
  }

  return listings || [];
}

export default async function ListingsPage() {
  const listings = await getListings();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Skill Listings</h1>
            <p className="text-muted-foreground">Discover skills offered and requested by the community.</p>
        </div>
        <Link href="/listings/create">
  <Button>
    <PlusCircle className="mr-2 h-4 w-4" />
    Create New Listing
  </Button>
  </Link>
      </div>

      {/* Filters and Search Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end p-4 bg-secondary/30 rounded-lg shadow">
        <div className="md:col-span-2 lg:col-span-2">
          <label htmlFor="search" className="block text-sm font-medium text-muted-foreground mb-1">Search by keyword</label>
          <div className="relative">
            <Input id="search" placeholder="e.g., 'Python', 'Graphic Design'" className="pr-10" />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-muted-foreground mb-1">Type</label>
          <Select defaultValue="all">
            <SelectTrigger id="type">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="offered">Offers</SelectItem>
              <SelectItem value="wanted">Requests</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label htmlFor="sort" className="block text-sm font-medium text-muted-foreground mb-1">Sort by</label>
          <Select defaultValue="recent">
            <SelectTrigger id="sort">
              <SelectValue placeholder="Most Recent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Listings Grid */}
      {listings.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <List className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-xl font-semibold">No listings found</h3>
          <p className="mt-1 text-muted-foreground">
            Try adjusting your filters or check back later.
          </p>
          <Link href="/listings/create">
             <Button className="mt-6">
              Create a Listing
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
