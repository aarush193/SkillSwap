import { supabase } from "./supabase";
import type { SessionRecord } from "@/types/skillswap";

/**
 * Validates a meeting URL string to ensure it is a valid http or https URL.
 */
export function isValidMeetingUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validates whether a timezone string is a valid IANA timezone name.
 */
export function isValidIanaTimezone(tz: string): boolean {
  if (!tz || typeof tz !== "string") return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates date and time format.
 */
export function isValidDateTime(dateStr: string, timeStr: string): boolean {
  if (!dateStr || !timeStr) return false;
  const d = new Date(`${dateStr}T${timeStr}`);
  return !isNaN(d.getTime());
}

/**
 * Checks if the complete selected date and time in the given timezone is strictly in the future.
 */
export function isFutureDateTime(dateStr: string, timeStr: string, timeZone?: string): boolean {
  if (!dateStr || !timeStr) return false;
  const tz = timeZone && isValidIanaTimezone(timeZone)
    ? timeZone
    : (typeof window !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Asia/Kolkata");

  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);

  if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {
    return false;
  }

  const nowInTargetTz = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(nowInTargetTz);
  const getPart = (type: string) => Number(parts.find((p) => p.type === type)?.value || 0);

  const currentYear = getPart("year");
  const currentMonth = getPart("month");
  const currentDay = getPart("day");
  let currentHour = getPart("hour");
  if (currentHour === 24) currentHour = 0;
  const currentMinute = getPart("minute");

  const targetNowTimestamp = new Date(currentYear, currentMonth - 1, currentDay, currentHour, currentMinute, 0, 0).getTime();
  const scheduledTimestamp = new Date(year, month - 1, day, hours, minutes, 0, 0).getTime();

  return scheduledTimestamp > targetNowTimestamp;
}

/**
 * Upserts (creates or updates) a session for an exchange.
 */
export async function scheduleSession(payload: {
  exchangeId: string;
  teacherId: string;
  learnerId: string;
  scheduledDate: string;
  scheduledTime: string;
  meetingLink: string;
  timezone?: string;
}): Promise<{ data: SessionRecord | null; error: Error | null }> {
  try {
    const { exchangeId, teacherId, learnerId, scheduledDate, scheduledTime, meetingLink, timezone } = payload;
    const sessionTimezone = timezone && isValidIanaTimezone(timezone)
      ? timezone
      : (typeof window !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Asia/Kolkata");

    // 1. Validate URL
    if (!isValidMeetingUrl(meetingLink)) {
      return { data: null, error: new Error("Please enter a valid meeting URL starting with http:// or https://") };
    }

    // 2. Validate Date & Time format and ensure it is in the future
    if (!isValidDateTime(scheduledDate, scheduledTime)) {
      return { data: null, error: new Error("Please enter a valid date and time.") };
    }

    if (!isFutureDateTime(scheduledDate, scheduledTime, sessionTimezone)) {
      return { data: null, error: new Error("Sessions cannot be scheduled or rescheduled in the past. Please select a future date and time.") };
    }

    // 3. Verify Exchange exists & is accepted
    const { data: exchange, error: exError } = await supabase
      .from("exchanges")
      .select("id, status, provider_id, requester_id")
      .eq("id", exchangeId)
      .single();

    if (exError || !exchange) {
      return { data: null, error: new Error("Associated exchange proposal not found.") };
    }

    if (exchange.status !== "accepted") {
      return { data: null, error: new Error("Sessions can only be scheduled for accepted exchanges.") };
    }

    // 4. Verify participant authorization
    const { data: authData } = await supabase.auth.getUser();
    const currentUserId = authData?.user?.id;

    if (!currentUserId || (currentUserId !== exchange.provider_id && currentUserId !== exchange.requester_id)) {
      return { data: null, error: new Error("You are not authorized to schedule a session for this exchange.") };
    }

    // 5. Check if session already exists for this exchange
    const { data: existingSession } = await supabase
      .from("sessions")
      .select("id")
      .eq("exchange_id", exchangeId)
      .maybeSingle();

    const sessionPayload = {
      exchange_id: exchangeId,
      teacher_id: teacherId,
      learner_id: learnerId,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      meeting_link: meetingLink.trim(),
      timezone: sessionTimezone,
      status: "scheduled",
      updated_at: new Date().toISOString(),
    };

    let resultData: SessionRecord | null = null;

    if (existingSession) {
      const { data, error } = await supabase
        .from("sessions")
        .update(sessionPayload)
        .eq("id", existingSession.id)
        .select()
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      resultData = data as SessionRecord;
    } else {
      const { data, error } = await supabase
        .from("sessions")
        .insert({
          ...sessionPayload,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      resultData = data as SessionRecord;
    }

    return { data: resultData, error: null };
  } catch (err: any) {
    console.error("Error scheduling session:", err);
    return { data: null, error: new Error(err.message || "Failed to schedule session.") };
  }
}

/**
 * Fetches sessions for a list of exchange IDs.
 */
export async function fetchSessionsForExchanges(exchangeIds: string[]): Promise<{ [exchangeId: string]: SessionRecord }> {
  if (!exchangeIds || exchangeIds.length === 0) return {};

  try {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .in("exchange_id", exchangeIds);

    if (error) {
      if (error.code === '42P01' || error.message?.includes('relation "sessions" does not exist') || error.code === 'PGRST205') {
        console.warn("Notice: The 'sessions' table is not created in Supabase yet. Run supabase/sessions-setup.sql in Supabase SQL Editor to enable sessions.");
      } else {
        console.error("Error fetching sessions:", error.message || error.details || error);
      }
      return {};
    }

    if (!data) return {};

    const sessionMap: { [exchangeId: string]: SessionRecord } = {};
    for (const s of data) {
      sessionMap[s.exchange_id] = s as SessionRecord;
    }
    return sessionMap;
  } catch (err) {
    console.error("Unexpected error fetching sessions:", err);
    return {};
  }
}

/**
 * Updates session status (e.g. to 'completed' or 'cancelled').
 */
export async function updateSessionStatus(
  sessionId: string,
  status: "scheduled" | "completed" | "cancelled"
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const updateData: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "completed" || status === "cancelled") {
      updateData.meeting_link = null;
    }

    const { error } = await supabase
      .from("sessions")
      .update(updateData)
      .eq("id", sessionId);

    if (error) {
      return { success: false, error: new Error(error.message) };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: new Error(err.message || "Failed to update session status") };
  }
}
