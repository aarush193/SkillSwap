import { supabase } from "./supabase";
import type { ExchangeRecord, TimeLedgerEntry } from "@/types/skillswap";

/**
 * Normalizes PostgreSQL / RPC error messages into human-readable messages.
 */
function normalizeExchangeError(error: any): Error {
  if (!error) return new Error("An unknown error occurred.");
  
  const msg = error.message || error.details || String(error);
  
  if (msg.includes("Authentication required")) {
    return new Error("Please sign in to perform this action.");
  }
  if (msg.includes("Target listing is not open")) {
    return new Error("This listing is no longer open for exchange proposals.");
  }
  if (msg.includes("Self-exchange is prohibited")) {
    return new Error("You cannot propose a skill exchange on your own listing.");
  }
  if (msg.includes("Insufficient available Time Bank hours")) {
    return new Error("You do not have enough available Time Bank hours for this request.");
  }
  if (msg.includes("100-hour Time Bank balance cap") || msg.includes("100-hour cap")) {
    return new Error("Action unavailable: Provider cannot receive hours as it would exceed their 100-hour maximum balance cap.");
  }
  if (msg.includes("idx_unique_active_exchange") || msg.includes("duplicate key value")) {
    return new Error("You already have an active exchange request for this listing.");
  }
  if (msg.includes("Requester no longer has enough available hours")) {
    return new Error("Cannot accept: Requester does not have enough available hours.");
  }
  if (msg.includes("Only the listing provider can accept")) {
    return new Error("Only the listing provider can accept this exchange proposal.");
  }
  if (msg.includes("Only the provider can reject")) {
    return new Error("Only the provider can decline this request.");
  }
  if (msg.includes("You are not a participant")) {
    return new Error("You are not authorized to perform actions on this exchange.");
  }
  if (msg.includes("Exchange record not found")) {
    return new Error("The requested exchange agreement was not found.");
  }

  return new Error(msg);
}

/**
 * 1. Creates a new exchange request via RPC.
 */
export async function createExchangeRequest(payload: {
  listingId: string;
  skillName: string;
  hours: number;
}): Promise<{ data: { exchange_id: string; status: string } | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc("create_exchange_request", {
      p_listing_id: payload.listingId,
      p_skill_name: payload.skillName,
      p_hours: payload.hours,
    });

    if (error) {
      console.error("RPC create_exchange_request error:", error);
      return { data: null, error: normalizeExchangeError(error) };
    }

    return { data, error: null };
  } catch (err: any) {
    console.error("Unexpected error creating exchange request:", err);
    return { data: null, error: normalizeExchangeError(err) };
  }
}

/**
 * 2. Provider accepts exchange & reserves requester's hours via RPC.
 */
export async function acceptExchange(exchangeId: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc("accept_exchange_and_reserve", {
      p_exchange_id: exchangeId,
    });

    if (error) {
      console.error("RPC accept_exchange_and_reserve error:", error);
      return { success: false, error: normalizeExchangeError(error) };
    }

    return { success: data?.success ?? true, error: null };
  } catch (err: any) {
    console.error("Unexpected error accepting exchange:", err);
    return { success: false, error: normalizeExchangeError(err) };
  }
}

/**
 * 3. Provider rejects exchange request via RPC.
 */
export async function rejectExchange(exchangeId: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc("reject_exchange_request", {
      p_exchange_id: exchangeId,
    });

    if (error) {
      console.error("RPC reject_exchange_request error:", error);
      return { success: false, error: normalizeExchangeError(error) };
    }

    return { success: data?.success ?? true, error: null };
  } catch (err: any) {
    console.error("Unexpected error rejecting exchange:", err);
    return { success: false, error: normalizeExchangeError(err) };
  }
}

/**
 * 4. Cancels an exchange (releases reservation if accepted) via RPC.
 */
export async function cancelExchange(exchangeId: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc("cancel_exchange", {
      p_exchange_id: exchangeId,
    });

    if (error) {
      console.error("RPC cancel_exchange error:", error);
      return { success: false, error: normalizeExchangeError(error) };
    }

    return { success: data?.success ?? true, error: null };
  } catch (err: any) {
    console.error("Unexpected error cancelling exchange:", err);
    return { success: false, error: normalizeExchangeError(err) };
  }
}

/**
 * 5. Participant confirms completion & triggers atomic settlement via RPC when both confirm.
 */
export async function confirmAndSettleExchange(
  exchangeId: string
): Promise<{ data: { settled: boolean; status: string } | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc("confirm_and_settle_exchange", {
      p_exchange_id: exchangeId,
    });

    if (error) {
      console.error("RPC confirm_and_settle_exchange error:", error);
      return { data: null, error: normalizeExchangeError(error) };
    }

    return { data, error: null };
  } catch (err: any) {
    console.error("Unexpected error confirming exchange:", err);
    return { data: null, error: normalizeExchangeError(err) };
  }
}

/**
 * 6. Fetches all exchanges involving the specified user with populated profile & listing metadata.
 */
export async function fetchUserExchanges(userId: string): Promise<{ data: ExchangeRecord[]; error: Error | null }> {
  if (!userId) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from("exchanges")
      .select(`
        *,
        requester:profiles!exchanges_requester_id_fkey(id, name),
        provider:profiles!exchanges_provider_id_fkey(id, name),
        listing:listings!exchanges_listing_id_fkey(id, title)
      `)
      .or(`requester_id.eq.${userId},provider_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user exchanges:", error);
      return { data: [], error: normalizeExchangeError(error) };
    }

    const enriched: ExchangeRecord[] = (data || []).map((e: any) => {
      const reqProfile = Array.isArray(e.requester) ? e.requester[0] : e.requester;
      const provProfile = Array.isArray(e.provider) ? e.provider[0] : e.provider;
      const lst = Array.isArray(e.listing) ? e.listing[0] : e.listing;

      return {
        ...e,
        requester_name: reqProfile?.name || "Community Member",
        provider_name: provProfile?.name || "Community Member",
        listing_title: lst?.title || "Skill Listing",
      };
    });

    return { data: enriched, error: null };
  } catch (err: any) {
    console.error("Unexpected error fetching user exchanges:", err);
    return { data: [], error: normalizeExchangeError(err) };
  }
}

/**
 * 7. Fetches the Time Bank ledger transaction history for a user.
 */
export async function fetchUserLedger(userId: string): Promise<{ data: TimeLedgerEntry[]; error: Error | null }> {
  if (!userId) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from("time_ledger")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user time ledger:", error);
      return { data: [], error: normalizeExchangeError(error) };
    }

    return { data: (data as TimeLedgerEntry[]) || [], error: null };
  } catch (err: any) {
    console.error("Unexpected error fetching user ledger:", err);
    return { data: [], error: normalizeExchangeError(err) };
  }
}
