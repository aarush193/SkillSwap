"use client";

import type { UserProfile, Skill } from "@/types/skillswap";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Star, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Predefined restricted Skill Taxonomy
const SKILL_TAXONOMY: { category: string; skills: string[] }[] = [
  {
    category: "Technology",
    skills: [
      "Frontend (React / Next.js)",
      "Backend (Node.js / Express)",
      "Python & Django",
      "Mobile App Dev (React Native / Flutter)",
      "Data Science & AI",
      "DevOps & AWS Cloud",
      "Web Security",
      "Database Admin (PostgreSQL / SQL)",
      "UI/UX Design",
    ],
  },
  {
    category: "Creative & Media",
    skills: [
      "Graphic Design & Branding",
      "Video Editing & Premiere",
      "3D Modeling & Animation",
      "Photography & Retouching",
      "Music Production & Audio",
      "Content Writing & Copywriting",
    ],
  },
  {
    category: "Business & Marketing",
    skills: [
      "SEO & Search Marketing",
      "Social Media Marketing",
      "Project Management (Agile)",
      "Business Strategy & Analytics",
      "Product Management",
      "Sales & Lead Generation",
    ],
  },
  {
    category: "Languages & Academics",
    skills: [
      "English Fluency / Writing",
      "Spanish Conversation",
      "French Language",
      "Mathematics & Calculus",
      "Physics & Engineering",
      "Public Speaking",
    ],
  },
  {
    category: "Lifestyle & Fitness",
    skills: [
      "Yoga & Mindfulness",
      "Personal Fitness Training",
      "Guitar / Piano Instruction",
      "Cooking & Culinary Arts",
      "Gardening & Plant Care",
    ],
  },
];

const generateSkillId = () => `skill_${Math.random().toString(36).substr(2, 9)}`;

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  bio: z.string().max(500, { message: "Bio must not exceed 500 characters." }).optional().default(""),
  backgroundImageUrl: z
    .string()
    .url({ message: "Please enter a valid image URL" })
    .optional()
    .nullable()
    .or(z.literal("")),
  timeAvailable: z.string().optional().default(""),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EditProfileFormProps {
  user: UserProfile;
  onSave: (data: Partial<UserProfile>) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
  isSuccess: boolean;
}

export function EditProfileForm({ user, onSave, onCancel, isSaving, isSuccess }: EditProfileFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadMethod, setUploadMethod] = useState<"url" | "file">("url");

  // State for restricted skills (offered vs wanted)
  const [skillsOffered, setSkillsOffered] = useState<Skill[]>(user.skillsOffered || []);
  const [skillsWanted, setSkillsWanted] = useState<Skill[]>(user.skillsWanted || []);
  const [expandedCategory, setExpandedCategory] = useState<string>("Technology");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name,
      bio: user.bio || "",
      backgroundImageUrl: user.backgroundImageUrl || "",
      timeAvailable: user.timeAvailable || "",
    },
  });

  const toggleSkillOffered = (skillName: string, category: string) => {
    setSkillsOffered((prev) => {
      const exists = prev.some((s) => s.name === skillName);
      if (exists) {
        return prev.filter((s) => s.name !== skillName);
      } else {
        return [...prev, { id: generateSkillId(), name: skillName, category }];
      }
    });
  };

  const toggleSkillWanted = (skillName: string, category: string) => {
    setSkillsWanted((prev) => {
      const exists = prev.some((s) => s.name === skillName);
      if (exists) {
        return prev.filter((s) => s.name !== skillName);
      } else {
        return [...prev, { id: generateSkillId(), name: skillName, category }];
      }
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function onSubmit(values: ProfileFormValues) {
    let finalBackgroundImageUrl: string | undefined = values.backgroundImageUrl || user.backgroundImageUrl || undefined;

    const updatedProfileData: Partial<UserProfile> = {
      name: values.name,
      bio: values.bio,
      backgroundImageUrl: finalBackgroundImageUrl,
      skillsOffered,
      skillsWanted,
      timeAvailable: values.timeAvailable,
    };
    await onSave(updatedProfileData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isSaving} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Background Image</h3>
            <Tabs defaultValue="url" onValueChange={(v) => setUploadMethod(v as "url" | "file")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="file">Upload</TabsTrigger>
              </TabsList>
              <TabsContent value="url">
                <FormField
                  control={form.control}
                  name="backgroundImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="Enter image URL"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent value="file">
                <div className="space-y-4">
                  <Input type="file" accept="image/*" onChange={handleFileChange} disabled={isSaving} />
                  {previewUrl && (
                    <div className="relative h-32 w-full overflow-hidden rounded-lg">
                      <Image src={previewUrl} alt="Background preview" layout="fill" objectFit="cover" />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us a little about yourself..."
                    className="resize-y min-h-[90px]"
                    {...field}
                    disabled={isSaving}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* RESTRICTED SKILLS SELECTION SYSTEM */}
          <div className="space-y-4 pt-2">
            <div className="border-b pb-2">
              <h3 className="text-base font-bold text-foreground">Skills & Expertise Registry</h3>
              <p className="text-xs text-muted-foreground">Select skills to feature on your profile by checking the boxes below.</p>
            </div>

            {/* Category Accordion Selector */}
            <div className="space-y-3">
              {SKILL_TAXONOMY.map((group) => {
                const isExpanded = expandedCategory === group.category;

                return (
                  <div key={group.category} className="border border-border/70 rounded-lg overflow-hidden bg-card/40">
                    <button
                      type="button"
                      onClick={() => setExpandedCategory(isExpanded ? "" : group.category)}
                      className="w-full px-4 py-3 flex items-center justify-between font-semibold text-sm bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        {group.category}
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                          {group.skills.length} skills
                        </Badge>
                      </span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>

                    {isExpanded && (
                      <div className="p-4 space-y-4 bg-background/50">
                        {group.skills.map((skillName) => {
                          const isOffered = skillsOffered.some((s) => s.name === skillName);
                          const isWanted = skillsWanted.some((s) => s.name === skillName);

                          return (
                            <div key={skillName} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0 text-xs">
                              <span className="font-medium text-foreground">{skillName}</span>

                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <Checkbox
                                    checked={isOffered}
                                    onCheckedChange={() => toggleSkillOffered(skillName, group.category)}
                                    disabled={isSaving}
                                  />
                                  <span className="text-amber-500 font-semibold flex items-center gap-1">
                                    <Star className="h-3 w-3" /> Offer
                                  </span>
                                </label>

                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <Checkbox
                                    checked={isWanted}
                                    onCheckedChange={() => toggleSkillWanted(skillName, group.category)}
                                    disabled={isSaving}
                                  />
                                  <span className="text-indigo-400 font-semibold flex items-center gap-1">
                                    <BookOpen className="h-3 w-3" /> Learning
                                  </span>
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <FormField
            control={form.control}
            name="timeAvailable"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Availability</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Weekdays, Evenings, Remote Only" {...field} disabled={isSaving} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving} className={cn(isSuccess && "bg-emerald-600 hover:bg-emerald-700")}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSuccess && <CheckCircle2 className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : isSuccess ? "Saved!" : "Save Profile"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

