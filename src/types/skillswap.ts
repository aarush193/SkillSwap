export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  backgroundImageUrl?: string;
  bio?: string;
  skillsOffered: Skill[];
  skillsWanted: Skill[];
  timeAvailable?: string; // e.g., "5 hours/week"
  timeBalance: number; // in hours
  reservedHours: number; // in hours
  availableHours: number; // timeBalance - reservedHours
}

export type ExchangeStatus = "requested" | "accepted" | "rejected" | "cancelled" | "completed";

export type SessionStatus = "scheduled" | "completed" | "cancelled";

export interface SessionRecord {
  id: string;
  exchange_id: string;
  teacher_id: string;
  learner_id: string;
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time: string; // HH:mm or HH:mm:ss
  meeting_link: string | null;
  timezone?: string;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
}

export interface ExchangeRecord {
  id: string;
  listing_id: string;
  requester_id: string;
  provider_id: string;
  skill_name: string;
  hours: number;
  status: ExchangeStatus;
  requester_confirmed: boolean;
  provider_confirmed: boolean;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  // Joined/Populated profile & listing details
  requester_name?: string;
  provider_name?: string;
  listing_title?: string;
  session?: SessionRecord | null;
}

export interface TimeLedgerEntry {
  id: string;
  exchange_id?: string | null;
  user_id: string;
  amount: number;
  entry_type: "initial_grant" | "exchange_debit" | "exchange_credit";
  balance_after: number;
  reserved_after: number;
  description: string;
  created_at: string;
}

export interface Skill {
  id: string;
  name: string;
  category?: string;
}

export interface Listing {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar_url?: string;
  type: "offered" | "wanted";
  title: string;
  category: string;
  sub_category: string;
  skill_names: string[];
  description: string;
  tags: string[];
  created_at: string;
  status: "open" | "closed" | "in_progress" | "deleted";
}

export interface TimeLog {
  id: string;
  fromUserId: string;
  toUserId: string;
  skillId: string;
  skillName: string;
  hours: number;
  description?: string;
  date: Date;
  type: "credit" | "debit"; // From the perspective of the system or current user
}

export interface TimeTransaction {
  id: string;
  userName: string; // Person you exchanged with
  skillName: string;
  hours: number;
  description?: string;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  listing_id?: string | null;
  content: string;
  read_at?: string | null;
  created_at: string;
  sender_profile?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  receiver_profile?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface Conversation {
  partner_id: string;
  partner_name: string;
  partner_avatar_url?: string;
  latest_message_content: string;
  latest_message_timestamp: string;
  has_unread: boolean;
  listing_id?: string | null;
}

