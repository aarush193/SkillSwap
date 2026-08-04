import type { Metadata } from 'next';
import type { Listing, UserProfile } from "@/types/skillswap";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, CalendarDays, Clock, Mail, MessageSquare, User, Tag, Info } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from 'date-fns';

// This would typically be a server component fetching data based on params.id
// For now, it's a client component with mock data for structure.

// Mock data - replace with actual data fetching
const getMockListing = (id: string): Listing | null => {
  if (id === "1") {
    return {
      id: "1",
      userId: "user1",
      userName: "Alice Wonderland",
      userAvatarUrl: "https://picsum.photos/seed/alice/100/100",
      type: "offer",
      skill: { id: "s1", name: "Advanced JavaScript Tutoring", category: "Tech" },
      description: "Offering in-depth JavaScript tutoring, covering ES6+, async/await, and functional programming concepts. Suitable for intermediate to advanced learners. I have 5 years of experience building complex web applications and enjoy helping others level up their skills. We can tailor sessions to your specific needs, whether it's project-based help or concept clarification.",
      tags: ["JavaScript", "Tutoring", "Web Development", "ES6", "React", "Node.js"],
      createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
      status: "open",
    };
  }
  return null;
};

const mockListerProfile: Partial<UserProfile> = {
    id: "user1",
    name: "Alice Wonderland",
    email: "alice@example.com",
    avatarUrl: "https://picsum.photos/seed/alice/100/100",
    bio: "Full-stack developer with a passion for teaching and open source.",
    timeAvailable: "Mon-Fri evenings",
    skillsOffered: [{ id: "s1", name: "Advanced JavaScript Tutoring", category: "Tech" }, {id: "s_other", name: "Python Basics", category: "Tech"}]
};

// Function to generate metadata dynamically (if it were a server component)
// export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
//   const listing = await getMockListing(params.id); // Replace with actual data fetch
//   if (!listing) {
//     return { title: 'Listing Not Found - SkillSwap' };
//   }
//   return {
//     title: `${listing.skill.name} by ${listing.userName} - SkillSwap`,
//     description: listing.description.substring(0, 160),
//   };
// }
// For client component, metadata needs to be defined statically or use a different approach.
// For this exercise, we'll set a generic title.
export const metadata: Metadata = {
    title: 'Listing Details - SkillSwap',
};


export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const listing = getMockListing(params.id); // In real app, fetch data using params.id
  const listerProfile = mockListerProfile; // Fetch lister's profile too

  if (!listing) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-semibold">Listing Not Found</h1>
        <p className="text-muted-foreground mt-2">The listing you are looking for does not exist or has been removed.</p>
        <Button asChild className="mt-6">
          <Link href="/listings">Back to Listings</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Listing Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-xl overflow-hidden">
             <div className="relative h-64 w-full bg-secondary">
                <Image 
                    src={`https://picsum.photos/seed/${listing.skill.name}/800/300`}
                    alt={listing.skill.name}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint="skill abstract"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-6 flex flex-col justify-end">
                    <Badge variant={listing.type === "offer" ? "default" : "accent"} className="mb-2 capitalize w-fit text-sm px-3 py-1">
                        {listing.type === "offer" ? "Offering Skill" : "Requesting Skill"}
                    </Badge>
                    <h1 className="text-3xl md:text-4xl font-bold text-white shadow-text">{listing.skill.name}</h1>
                    {listing.skill.category && (
                        <p className="text-lg text-primary-foreground/80 mt-1">{listing.skill.category}</p>
                    )}
                 </div>
             </div>

            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2 flex items-center"><Info className="mr-2 h-5 w-5 text-primary"/>Description</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{listing.description}</p>
              </div>

              {listing.tags && listing.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center"><Tag className="mr-2 h-5 w-5 text-primary"/>Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {listing.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-sm">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="border-t pt-4">
                 <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" /> Posted on: {format(new Date(listing.createdAt), "PPP")}
                 </p>
                 <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                    <Clock className="h-4 w-4" /> Status: <Badge variant={listing.status === "open" ? "outline" : "destructive"} className="capitalize ml-1">{listing.status}</Badge>
                 </p>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Sidebar with Lister Info and Actions */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <Avatar className="mx-auto h-24 w-24 mb-3 border-4 border-primary/50">
                <AvatarImage src={listerProfile.avatarUrl} alt={listerProfile.name} data-ai-hint="user avatar" />
                <AvatarFallback className="text-3xl">{listerProfile.name?.substring(0,1)}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{listerProfile.name}</CardTitle>
              <CardDescription className="text-primary hover:underline">
                  <Link href={`/profile/${listerProfile.id}`}>View Profile</Link>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
               {listerProfile.bio && <p className="text-sm text-muted-foreground text-center italic line-clamp-3">"{listerProfile.bio}"</p>}
               <Separator />
                <div className="text-sm space-y-1">
                    <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary"/> {listerProfile.email}</p>
                    <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary"/> Availability: {listerProfile.timeAvailable || "Not specified"}</p>
                </div>
                {listerProfile.skillsOffered && listerProfile.skillsOffered?.length > 0 && (
                    <>
                    <Separator />
                    <div>
                        <h4 className="font-medium mb-1 text-sm text-muted-foreground">Other skills by {listerProfile.name}:</h4>
                        <div className="flex flex-wrap gap-1.5">
                        {listerProfile.skillsOffered.slice(0,3).map(skill => (
                            <Badge key={skill.id} variant="outline" className="text-xs">{skill.name}</Badge>
                        ))}
                        </div>
                    </div>
                    </>
                )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                <MessageSquare className="mr-2 h-4 w-4" /> Contact {listing.userName}
              </Button>
              {/* Add other actions like "Propose Exchange" */}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
const Separator = () => <hr className="my-3 border-border" />;
