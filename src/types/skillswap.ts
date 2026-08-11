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
  timeBalance: number; // in minutes or hours
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

