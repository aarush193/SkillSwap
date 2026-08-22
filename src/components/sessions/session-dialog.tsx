"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Calendar, Clock, Link as LinkIcon, Video } from "lucide-react";
import { scheduleSession, isValidMeetingUrl, isFutureDateTime } from "@/lib/session-service";
import { useToast } from "@/hooks/use-toast";
import type { ExchangeRecord } from "@/types/skillswap";

interface SessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exchange: ExchangeRecord | null;
  currentUserId: string;
  onSessionSaved: () => void;
}

export function SessionDialog({
  open,
  onOpenChange,
  exchange,
  currentUserId,
  onSessionSaved,
}: SessionDialogProps) {
  const { toast } = useToast();
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Local date calculation
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const currentHours = String(now.getHours()).padStart(2, "0");
  const currentMinutes = String(now.getMinutes()).padStart(2, "0");
  const minTimeStr = scheduledDate === todayStr ? `${currentHours}:${currentMinutes}` : undefined;

  useEffect(() => {
    if (exchange?.session) {
      setScheduledDate(exchange.session.scheduled_date || "");
      setScheduledTime(exchange.session.scheduled_time?.substring(0, 5) || "");
      setMeetingLink(exchange.session.meeting_link || "");
    } else {
      // Default to tomorrow at 10:00
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
      setScheduledDate(dateStr);
      setScheduledTime("10:00");
      setMeetingLink("");
    }
  }, [exchange, open]);

  if (!exchange) return null;

  // Determine teacher & learner
  // Default: Provider is teacher, Requester is learner
  const teacherId = exchange.provider_id;
  const learnerId = exchange.requester_id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scheduledDate || !scheduledTime) {
      toast({
        title: "Validation Error",
        description: "Please select both a date and time for the session.",
        variant: "destructive",
      });
      return;
    }

    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";

    if (!isFutureDateTime(scheduledDate, scheduledTime, userTimezone)) {
      toast({
        title: "Invalid Session Time",
        description: "Sessions cannot be scheduled or rescheduled in the past. Please select a future date and time.",
        variant: "destructive",
      });
      return;
    }

    if (!meetingLink.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a valid meeting URL (e.g. Zoom, Google Meet, Discord, etc.).",
        variant: "destructive",
      });
      return;
    }

    if (!isValidMeetingUrl(meetingLink)) {
      toast({
        title: "Invalid URL",
        description: "The meeting link must start with http:// or https://",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await scheduleSession({
        exchangeId: exchange.id,
        teacherId,
        learnerId,
        scheduledDate,
        scheduledTime,
        meetingLink,
        timezone: userTimezone,
      });

      if (error) {
        toast({
          title: "Failed to Schedule Session",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "📅 Session Scheduled!",
          description: "Both participants can now view session details and join using the meeting link.",
        });
        onOpenChange(false);
        onSessionSaved();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[485px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Video className="h-5 w-5 text-primary" />
            {exchange.session ? "Reschedule Learning Session" : "Schedule Learning Session"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Set a date, time, and external video meeting URL (Zoom, Google Meet, Discord, Teams, etc.) for target skill:{" "}
            <span className="font-semibold text-foreground">{exchange.skill_name}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-3">
          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="session-date" className="text-xs font-semibold flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" /> Date
              </Label>
              <Input
                id="session-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={todayStr}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="session-time" className="text-xs font-semibold flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" /> Time
              </Label>
              <Input
                id="session-time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                min={minTimeStr}
                required
                className="text-xs"
              />
            </div>
          </div>

          {/* Meeting Link Input */}
          <div className="space-y-1.5">
            <Label htmlFor="meeting-link" className="text-xs font-semibold flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5 text-primary" /> External Meeting Link
            </Label>
            <Input
              id="meeting-link"
              type="url"
              placeholder="https://meet.google.com/abc-defg-hij or https://zoom.us/j/..."
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              required
              className="text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Supports Google Meet, Zoom, Discord, MS Teams, or any valid HTTP/HTTPS URL.
            </p>
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting} className="text-xs font-semibold">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Saving...
                </>
              ) : exchange.session ? (
                "Update Session"
              ) : (
                "Schedule Session"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
