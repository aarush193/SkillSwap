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
import { Loader2, Upload, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Helper to generate simple unique IDs for new skills
const generateSkillId = () => `skill_${Math.random().toString(36).substr(2, 9)}`;

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  bio: z.string().max(500, { message: "Bio must not exceed 500 characters." }).optional().default(""),
  backgroundImageUrl: z
    .string()
    .url({ message: "Please enter a valid image URL" })
    .optional()
    .nullable()
    .or(z.literal("")),  // Allow empty string
  skillsOfferedStr: z.string().optional().default(""),
  skillsWantedStr: z.string().optional().default(""),
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

  // Convert skills arrays to comma-separated strings for form
  const skillsOfferedStr = user.skillsOffered.map(s => s.name).join(", ");
  const skillsWantedStr = user.skillsWanted.map(s => s.name).join(", ");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name,
      bio: user.bio || "",
      backgroundImageUrl: user.backgroundImageUrl || "",
      skillsOfferedStr,
      skillsWantedStr,
      timeAvailable: user.timeAvailable || "",
    },
  });

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function onSubmit(values: ProfileFormValues) {
    const skillsOfferedArray: Skill[] = values.skillsOfferedStr
      ? values.skillsOfferedStr.split(",").map(name => name.trim()).filter(Boolean).map(name => ({ id: generateSkillId(), name }))
      : [];
    const skillsWantedArray: Skill[] = values.skillsWantedStr
      ? values.skillsWantedStr.split(",").map(name => name.trim()).filter(Boolean).map(name => ({ id: generateSkillId(), name }))
      : [];

    let finalBackgroundImageUrl: string | undefined;
    
    if (uploadMethod === "url") {
      finalBackgroundImageUrl = values.backgroundImageUrl || undefined;
    } else if (uploadMethod === "file" && selectedFile) {
      // TODO: Implement actual file upload to Supabase Storage here
      // For now, we are not saving the uploaded file, only the URL if provided
      console.warn("File upload selected, but actual upload logic to Supabase Storage is not implemented. Background image will not be saved from file.");
      // Example of what you would do:
      // try {
      //   const permanentUrl = await uploadFileToSupabaseStorage(selectedFile);
      //   finalBackgroundImageUrl = permanentUrl;
      // } catch (uploadError) {
      //   console.error("File upload failed:", uploadError);
      //   // Potentially show a toast to the user
      //   finalBackgroundImageUrl = user.backgroundImageUrl; // Revert to original or undefined
      // }
      finalBackgroundImageUrl = undefined; // Placeholder: clear or keep old one user.backgroundImageUrl
    } else {
      // No URL provided and no file selected, or file selected but upload method not 'file'
      finalBackgroundImageUrl = values.backgroundImageUrl || user.backgroundImageUrl || undefined; // Keep existing if no new URL/file action
    }

    const updatedProfileData: Partial<UserProfile> = {
      name: values.name,
      bio: values.bio,
      backgroundImageUrl: finalBackgroundImageUrl, // Use the processed URL
      skillsOffered: skillsOfferedArray,
      skillsWanted: skillsWantedArray,
      timeAvailable: values.timeAvailable,
    };
    await onSave(updatedProfileData); // Marked await
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
                <FormLabel className="cursor-pointer">Name</FormLabel>
              <FormControl>
                  <Input 
                    {...field} 
                    disabled={isSaving}
                    className={cn(
                      "cursor-text",
                      isSaving && "cursor-not-allowed opacity-50"
                    )}
                  />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

          <div className="space-y-4">
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
                          className={cn(
                            "cursor-text",
                            isSaving && "cursor-not-allowed opacity-50"
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent value="file">
                <div className="space-y-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isSaving}
                    className={cn(
                      isSaving && "cursor-not-allowed opacity-50"
                    )}
                  />
                  {previewUrl && (
                    <div className="relative h-32 w-full overflow-hidden rounded-lg">
                      <Image
                        src={previewUrl}
                        alt="Background preview"
                        layout="fill"
                        objectFit="cover"
                      />
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
                <FormLabel className="cursor-pointer">Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little about yourself..."
                    className={cn(
                      "resize-y min-h-[100px] cursor-text",
                      isSaving && "cursor-not-allowed opacity-50"
                    )}
                  {...field}
                  disabled={isSaving}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="skillsOfferedStr"
          render={({ field }) => (
            <FormItem>
                <FormLabel className="cursor-pointer">Skills Offered</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., JavaScript, Graphic Design, Spanish Tutoring (comma-separated)"
                    className={cn(
                      "cursor-text",
                      isSaving && "cursor-not-allowed opacity-50"
                    )}
                  {...field}
                  disabled={isSaving}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="skillsWantedStr"
          render={({ field }) => (
            <FormItem>
                <FormLabel className="cursor-pointer">Skills Wanted</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Python, Public Speaking, Yoga (comma-separated)"
                    className={cn(
                      "cursor-text",
                      isSaving && "cursor-not-allowed opacity-50"
                    )}
                  {...field}
                  disabled={isSaving}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timeAvailable"
          render={({ field }) => (
            <FormItem>
                <FormLabel className="cursor-pointer">Time Available</FormLabel>
              <FormControl>
                  <Input 
                    placeholder="e.g., 5-10 hours/week, Evenings" 
                    {...field} 
                    disabled={isSaving}
                    className={cn(
                      "cursor-text",
                      isSaving && "cursor-not-allowed opacity-50"
                    )}
                  />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            className={cn(
              isSaving && "opacity-50 cursor-not-allowed"
            )}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSaving}
            className={cn(
              "min-w-[100px]",
              isSuccess && "bg-green-600 hover:bg-green-700",
              isSaving && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSuccess && <CheckCircle2 className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : isSuccess ? "Saved!" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
