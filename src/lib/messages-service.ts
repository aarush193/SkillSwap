import { supabase } from "./supabase";
import type { DirectMessage, Conversation } from "@/types/skillswap";

/**
 * Interface for creating a new message
 */
export interface SendMessagePayload {
  senderId: string;
  receiverId: string;
  content: string;
  listingId?: string | null;
}

/**
 * Sends a new direct message between users.
 * Validates non-empty content and sender !== receiver constraint.
 */
export async function sendMessage(payload: SendMessagePayload): Promise<{ data: DirectMessage | null; error: Error | null }> {
  const { senderId, receiverId, content, listingId } = payload;

  const trimmedContent = content?.trim();
  if (!trimmedContent) {
    return { data: null, error: new Error("Message content cannot be empty or whitespace only.") };
  }

  if (senderId === receiverId) {
    return { data: null, error: new Error("You cannot send a message to yourself.") };
  }

  try {
    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          sender_id: senderId,
          receiver_id: receiverId,
          content: trimmedContent,
          listing_id: listingId || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error in sendMessage service:", error);
      return { data: null, error: new Error(error.message || "Failed to send message.") };
    }

    return { data: data as DirectMessage, error: null };
  } catch (err: any) {
    console.error("Unexpected error in sendMessage:", err);
    return { data: null, error: new Error(err.message || "An unexpected error occurred while sending message.") };
  }
}

/**
 * Fetches all 1-to-1 conversations for a user.
 * Groups messages by conversation partner, fetching current profile details (name, avatar_url)
 * via foreign key relationship to avoid N+1 queries.
 */
export async function fetchConversations(userId: string): Promise<{ data: Conversation[]; error: Error | null }> {
  if (!userId) {
    return { data: [], error: new Error("User ID is required to fetch conversations.") };
  }

  try {
    const { data: messages, error } = await supabase
      .from("messages")
      .select(`
        id,
        sender_id,
        receiver_id,
        listing_id,
        content,
        read_at,
        created_at,
        sender_profile:profiles!messages_sender_id_fkey(id, name, avatar_url),
        receiver_profile:profiles!messages_receiver_id_fkey(id, name, avatar_url)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error in fetchConversations service:", JSON.stringify(error, null, 2));
      return { data: [], error: new Error(error?.message || error?.details || "Failed to fetch conversations.") };
    }

    if (!messages || messages.length === 0) {
      return { data: [], error: null };
    }

    // Group by partner ID
    const conversationMap = new Map<string, Conversation>();

    for (const msg of messages) {
      const isSender = msg.sender_id === userId;
      const partnerId = isSender ? msg.receiver_id : msg.sender_id;
      const partnerProfile = isSender ? msg.receiver_profile : msg.sender_profile;

      if (!conversationMap.has(partnerId)) {
        const rawProfile = Array.isArray(partnerProfile) ? partnerProfile[0] : partnerProfile;
        
        conversationMap.set(partnerId, {
          partner_id: partnerId,
          partner_name: rawProfile?.name || "Community Member",
          partner_avatar_url: rawProfile?.avatar_url || undefined,
          latest_message_content: msg.content,
          latest_message_timestamp: msg.created_at,
          has_unread: !isSender && msg.read_at === null,
          listing_id: msg.listing_id,
        });
      } else {
        const conv = conversationMap.get(partnerId)!;
        // Check if there are any unread messages from partner
        if (!isSender && msg.read_at === null) {
          conv.has_unread = true;
        }
      }
    }

    return { data: Array.from(conversationMap.values()), error: null };
  } catch (err: any) {
    console.error("Unexpected error in fetchConversations:", err);
    return { data: [], error: new Error(err.message || "An unexpected error occurred while fetching conversations.") };
  }
}

/**
 * Fetches the full message thread between the current user and a conversation partner.
 * Messages are ordered chronologically (oldest to newest).
 */
export async function fetchMessageThread(
  userId: string,
  partnerId: string
): Promise<{ data: DirectMessage[]; error: Error | null }> {
  if (!userId || !partnerId) {
    return { data: [], error: new Error("Both userId and partnerId are required.") };
  }

  try {
    const { data: messages, error } = await supabase
      .from("messages")
      .select(`
        id,
        sender_id,
        receiver_id,
        listing_id,
        content,
        read_at,
        created_at,
        sender_profile:profiles!messages_sender_id_fkey(id, name, avatar_url),
        receiver_profile:profiles!messages_receiver_id_fkey(id, name, avatar_url)
      `)
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error in fetchMessageThread service:", JSON.stringify(error, null, 2));
      return { data: [], error: new Error(error?.message || error?.details || "Failed to fetch message thread.") };
    }

    const formattedMessages: DirectMessage[] = (messages || []).map((m: any) => ({
      id: m.id,
      sender_id: m.sender_id,
      receiver_id: m.receiver_id,
      listing_id: m.listing_id,
      content: m.content,
      read_at: m.read_at,
      created_at: m.created_at,
      sender_profile: Array.isArray(m.sender_profile) ? m.sender_profile[0] : m.sender_profile,
      receiver_profile: Array.isArray(m.receiver_profile) ? m.receiver_profile[0] : m.receiver_profile,
    }));

    return { data: formattedMessages, error: null };
  } catch (err: any) {
    console.error("Unexpected error in fetchMessageThread:", err);
    return { data: [], error: new Error(err.message || "An unexpected error occurred while fetching message thread.") };
  }
}

/**
 * Marks messages from a specific partner as read for the current user.
 * Updates incoming messages where receiver_id = userId AND sender_id = partnerId AND read_at IS NULL.
 */
export async function markMessagesAsRead(
  userId: string,
  partnerId: string
): Promise<{ success: boolean; error: Error | null }> {
  if (!userId || !partnerId) {
    return { success: false, error: new Error("Both userId and partnerId are required.") };
  }

  try {
    const { error } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("receiver_id", userId)
      .eq("sender_id", partnerId)
      .is("read_at", null);

    if (error) {
      console.error("Error in markMessagesAsRead service:", error);
      return { success: false, error: new Error(error.message || "Failed to mark messages as read.") };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error("Unexpected error in markMessagesAsRead:", err);
    return { success: false, error: new Error(err.message || "An unexpected error occurred while updating read status.") };
  }
}
