"use client";

import type { UserProfile as UserProfileType, Skill } from "@/types/skillswap";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit3, Clock, Star, Search, Mail, CalendarDays } from "lucide-react";
import Image from "next/image";

interface ProfileDisplayProps {
  user: UserProfileType;
  onEdit: () => void;
}

function SkillPill({ skill }: { skill: Skill }) {
  return (
    <Badge variant="secondary" className="text-sm py-1 px-3 shadow-sm">
      {skill.name}
      {skill.category && <span className="ml-1.5 text-xs opacity-70">({skill.category})</span>}
    </Badge>
  );
}

export function ProfileDisplay({ user, onEdit }: ProfileDisplayProps) {
  const defaultBackgroundImage = "https://picsum.photos/seed/profilebg/1200/400";

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="relative">
        <div className="w-full h-48 md:h-64 relative overflow-hidden rounded-xl shadow-lg">
          <Image 
            src={user.backgroundImageUrl || defaultBackgroundImage}
            alt="Profile background" 
            layout="fill" 
            objectFit="cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        <div className="container max-w-6xl mx-auto px-4">
          <div className="relative -mt-20 flex flex-col md:flex-row md:items-end md:justify-between">
            <div className="flex items-end">
              <Avatar className="h-32 w-32 rounded-xl border-4 border-background shadow-xl">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
              <div className="ml-4 mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{user.name}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
              </div>
          </div>
            <div className="mt-4 md:mt-0 mb-4">
              <Button onClick={onEdit} variant="outline" className="shadow-sm">
            <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
            </div>
          </div>
        </div>
        </div>
        
      {/* Bio Section */}
      <div className="container max-w-6xl mx-auto px-4">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {user.bio || "No bio provided yet."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Time and Availability */}
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Clock className="text-primary h-6 w-6" /> Time Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {user.timeBalance.toFixed(1)} hours
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Available time for skill exchange
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <CalendarDays className="text-primary h-6 w-6" /> Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {user.timeAvailable || "No availability set"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Skills Section */}
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Star className="text-accent h-6 w-6" /> Skills Offered
              </CardTitle>
              <CardDescription>Skills willing to share with the community.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {user.skillsOffered.length > 0 ? (
              user.skillsOffered.map(skill => <SkillPill key={skill.id} skill={skill} />)
            ) : (
              <p className="text-muted-foreground">No skills offered yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Search className="text-primary h-6 w-6" /> Skills Wanted
              </CardTitle>
              <CardDescription>Areas looking to learn and grow.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {user.skillsWanted.length > 0 ? (
              user.skillsWanted.map(skill => <SkillPill key={skill.id} skill={skill} />)
            ) : (
              <p className="text-muted-foreground">No skills wanted at the moment.</p>
            )}
          </CardContent>
        </Card>
      </div>
            </div>
    </div>
  );
}
