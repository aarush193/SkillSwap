import { supabase } from "./supabase";
import { validateListingContent } from "./moderation";
import type { Listing } from "@/types/skillswap";

export interface CreateListingPayload {
  user_id: string;
  user_name: string;
  user_avatar_url?: string | null;
  type: "offered" | "wanted";
  title: string;
  category: string;
  sub_category: string;
  skill_names: string[];
  description: string;
  tags?: string[];
  status?: "open" | "closed" | "in_progress" | "deleted";
}

/**
 * Validates and creates a new listing in the database.
 * Ensures title and description pass content moderation.
 */
export async function createListing(payload: CreateListingPayload): Promise<{ data: Listing | null; error: Error | null }> {
  // 1. Server-side / backend moderation check
  const moderation = validateListingContent(payload.title, payload.description);
  if (!moderation.isValid) {
    return {
      data: null,
      error: new Error(moderation.error || "Please use an appropriate title and description."),
    };
  }

  // 2. Perform database insert
  const listingToInsert = {
    ...payload,
    tags: payload.tags || [],
    status: payload.status || "open",
  };

  const { data, error } = await supabase
    .from("listings")
    .insert([listingToInsert])
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as Listing, error: null };
}

/**
 * Validates and updates an existing listing in the database.
 * Ensures title and description pass content moderation.
 */
export async function updateListing(
  listingId: string,
  payload: Partial<CreateListingPayload>
): Promise<{ data: Listing | null; error: Error | null }> {
  // If title or description are being updated, run moderation check
  if (payload.title !== undefined || payload.description !== undefined) {
    const titleToTest = payload.title ?? "";
    const descToTest = payload.description ?? "";
    const moderation = validateListingContent(titleToTest, descToTest);
    if (!moderation.isValid) {
      return {
        data: null,
        error: new Error(moderation.error || "Please use an appropriate title and description."),
      };
    }
  }

  const { data, error } = await supabase
    .from("listings")
    .update(payload)
    .eq("id", listingId)
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as Listing, error: null };
}
