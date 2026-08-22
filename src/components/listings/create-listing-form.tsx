"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription as CardDesc, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, ArrowLeft } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "../../lib/supabase";
import { fetchUserProfile } from "@/lib/profile-service";
import { createListing } from "@/lib/listing-service";
import { validateListingContent } from "@/lib/moderation";
import { useToast } from "@/hooks/use-toast";
import { clsx } from "clsx";
import Link from "next/link";

const skillsData = [
  {
    name: "Technology",
    subCategories: [
      { name: "Web Development", skills: ["Frontend (React)", "Backend (Node.js)", "Full-Stack (MERN)", "DevOps", "WordPress Dev", "Shopify Dev", "Web Security", "PHP/Laravel", "Ruby on Rails"] },
      { name: "Mobile Development", skills: ["iOS (Swift)", "Android (Kotlin)", "React Native", "Flutter", "Mobile UI/UX", "Xamarin"] },
      { name: "Data Science", skills: ["Machine Learning", "Data Analysis", "Big Data", "AI Engineering", "NLP", "Deep Learning"] },
      { name: "Cloud Computing", skills: ["AWS", "Azure", "Google Cloud", "Serverless Arch.", "Kubernetes"] },
      { name: "Design", skills: ["Graphic Design", "UI/UX Design", "Illustration", "3D Modeling", "Brand Identity", "Logo Design"] },
      { name: "Multimedia", skills: ["Video Editing", "Animation", "Photography", "Music Production", "Motion Graphics"] },
    ],
  },
  {
    name: "Creative Arts",
    subCategories: [
      { name: "Design", skills: ["Graphic Design", "UI/UX Design", "Illustration", "3D Modeling", "Brand Identity", "Logo Design"] },
      { name: "Multimedia", skills: ["Video Editing", "Animation", "Photography", "Music Production", "Motion Graphics"] },
    ],
  },
  {
    name: "Business & Marketing",
    subCategories: [
        { name: "Digital Marketing", skills: ["SEO", "SEM", "Social Media Marketing", "Content Marketing", "Email Marketing", "PPC Advertising"]},
        { name: "Strategy & Management", skills: ["Business Analysis", "Project Management", "Product Management", "Agile Coaching", "Market Research"]},
    ]
  },
];

const listingFormSchema = z.object({
  type: z.enum(["offered", "wanted"], {
    required_error: "You need to select a listing type.",
  }),
  title: z.string().min(5, { message: "Title must be at least 5 characters." }).max(100, { message: "Title must not exceed 100 characters." }),
  category: z.string().min(1, { message: "Please select a category." }),
  subCategory: z.string().min(1, { message: "Please select a sub-category." }),
  skillName: z.array(z.string())
    .min(1, { message: "Please select at least one skill." })
    .max(5, { message: "You can select at most 5 skills." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }).max(500, { message: "Description must not exceed 500 characters." }),
  tags: z.string().optional(), 
}).refine(
  (data) => validateListingContent(data.title, "").isValid,
  {
    message: "Please use an appropriate title.",
    path: ["title"],
  }
).refine(
  (data) => validateListingContent("", data.description).isValid,
  {
    message: "Please use an appropriate description.",
    path: ["description"],
  }
);

type ListingFormValues = z.infer<typeof listingFormSchema>;

export function CreateListingForm() {
  const { toast } = useToast();
  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: {
      type: "offered",
      title: "",
      category: "",
      subCategory: "",
      skillName: [],
      description: "",
      tags: "",
    },
  });

  const selectedCategory = form.watch("category");
  const selectedSubCategory = form.watch("subCategory");

  const currentCategoryData = skillsData.find((c) => c.name === selectedCategory);
  const availableSubCategories = currentCategoryData?.subCategories || [];
  const currentSubCategoryData = currentCategoryData?.subCategories.find(
    (sc) => sc.name === selectedSubCategory
  );

  const availableSkills = currentSubCategoryData?.skills || [];

  const handleCategoryChange = (val: string) => {
    form.setValue("category", val);
    form.setValue("subCategory", "", { shouldValidate: true });
    form.setValue("skillName", [], { shouldValidate: false });
    form.clearErrors();
  };

  const handleSubCategoryChange = (val: string) => {
    form.setValue("subCategory", val);
    form.setValue("skillName", [], { shouldValidate: false });
    form.clearErrors();
  };

  async function onSubmit(values: ListingFormValues) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to create a listing.",
          variant: "destructive",
        });
        return;
      }

      // Frontend content moderation check
      const moderation = validateListingContent(values.title, values.description);
      if (!moderation.isValid) {
        toast({
          title: "Inappropriate Content",
          description: moderation.error || "Please use an appropriate title and description.",
          variant: "destructive",
        });
        return;
      }

      const userProfile = await fetchUserProfile(user.id);

      const listingToInsert = {
        user_id: user.id,
        user_name: userProfile?.name || user.user_metadata?.full_name || user.email,
        user_avatar_url: userProfile?.avatarUrl || user.user_metadata?.avatar_url || null,
        type: values.type,
        title: values.title,
        category: values.category,
        sub_category: values.subCategory,
        skill_names: values.skillName, // array of selected skills
        description: values.description,
        tags: values.tags?.split(',').map(tag => tag.trim()).filter(tag => tag) || [],
        status: 'open' as const
      };

      const { error: insertError } = await createListing(listingToInsert);

      if (insertError) {
        toast({
          title: "Error Creating Listing",
          description: insertError.message || "Could not save the listing. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Listing Created!",
          description: "Successfully created the listing.",
        });
        form.reset();
        window.location.href = "/listings";
      }
    } catch (error) {
      toast({
        title: "An Unexpected Error Occurred",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  }

  const currentSelectedSkills = form.watch("skillName") || [];

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Button variant="ghost" asChild className="mb-2 text-muted-foreground hover:text-foreground">
        <Link href="/listings">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Listings
        </Link>
      </Button>

      <Card className="w-full shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <PlusCircle className="h-6 w-6 text-primary" /> Create New Skill Listing
          </CardTitle>
          <CardDesc>Share your skills or let the community know what you&apos;re looking for. You can select up to 5 skills.</CardDesc>
        </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Listing Type*</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1 md:flex-row md:space-y-0 md:space-x-4"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="offered" />
                        </FormControl>
                        <FormLabel className="font-normal">I&apos;m offering a skill</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="wanted" />
                        </FormControl>
                        <FormLabel className="font-normal">I&apos;m requesting a skill</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title*</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Advanced JavaScript Tutoring" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category*</FormLabel>
                  <Select 
                    onValueChange={(val) => {
                      field.onChange(val);
                      handleCategoryChange(val);
                    }} 
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger suppressHydrationWarning={true}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {skillsData.map((category) => (
                        <SelectItem key={category.name} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sub-Category*</FormLabel>
                  <Select 
                    onValueChange={(val) => {
                      field.onChange(val);
                      handleSubCategoryChange(val);
                    }}
                    value={field.value || ""}
                    disabled={!selectedCategory || availableSubCategories.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger suppressHydrationWarning={true}>
                        <SelectValue placeholder="Select a sub-category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableSubCategories.map((subCategory) => (
                        <SelectItem key={subCategory.name} value={subCategory.name}>
                          {subCategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("subCategory") && (
              <FormField
                control={form.control}
                name="skillName"
                render={() => (
                  <FormItem>
                    <FormLabel>Skills* (Select up to 5)</FormLabel>
                    {availableSkills.length > 0 && (
                      <FormDescription>
                        Select the skill(s) you are offering or requesting.
                      </FormDescription>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      {availableSkills.map((skill) => (
                        <FormField
                          key={skill}
                          control={form.control}
                          name="skillName"
                          render={({ field }) => {
                            const isChecked = field.value?.includes(skill);
                            const isDisabled = !isChecked && currentSelectedSkills.length >= 5;
                            return (
                              <FormItem 
                                key={skill + "-item"}
                                className={clsx(
                                  "flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3",
                                  isDisabled && "opacity-50 cursor-not-allowed"
                                )}
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                      if (isDisabled && checked) return;
                                      const currentSkills = field.value || [];
                                      const nextSkills = checked
                                        ? [...currentSkills, skill]
                                        : currentSkills.filter((value) => value !== skill);
                                      field.onChange(nextSkills);
                                      form.setValue("skillName", nextSkills, { shouldValidate: true });
                                    }}
                                    disabled={isDisabled}
                                    aria-describedby={skill + "-desc"}
                                  />
                                </FormControl>
                                <FormLabel className={clsx(
                                  "font-normal",
                                  isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                                )}>
                                  {skill}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    {availableSkills.length === 0 && (
                       <p className='text-sm text-muted-foreground pt-2'>No skills listed for this sub-category yet.</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description* (Common for all selected skills)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide details about the skill(s), your experience, or what you're looking for."
                      className="resize-y min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                   <p className="text-xs text-muted-foreground text-right">{field.value?.length || 0} / 500</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (Optional, comma-separated, common for all skills)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., beginner, remote, project-based" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={form.formState.isSubmitting || currentSelectedSkills.length === 0}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> 
              {form.formState.isSubmitting ? "Creating..." : (
                <>
                  Create{" "}
                  {currentSelectedSkills.length > 0 ? currentSelectedSkills.length : ""}{" "}
                  Listing{currentSelectedSkills.length !== 1 && "s"}
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  </div>
  );
}
