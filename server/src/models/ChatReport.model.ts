export type ChatReportTargetType = "message" | "user";
export type ChatReportStatus = "open" | "reviewed" | "rejected";
export type ChatReportReason =
  | "spam"
  | "harassment"
  | "abuse"
  | "inappropriate_content"
  | "scam"
  | "fake_account"
  | "other";

export type ChatReportAction =
  | "dismiss"
  | "delete_message"
  | "warn"
  | "mute"
  | "temporary_chat_ban"
  | "permanent_chat_ban";

export interface ChatReport {
  id: number;
  reporter_user_id: number;
  target_type: ChatReportTargetType;
  target_user_id: number;
  message_id: number | null;
  reason: ChatReportReason;
  details: string | null;
  status: ChatReportStatus;
  reviewed_by: number | null;
  reviewed_at: string | null;
  admin_reason: string | null;
  action_taken: ChatReportAction | null;
  created_at: string;
  updated_at: string;
  reporter_nickname?: string;
  target_nickname?: string;
  reviewed_by_nickname?: string | null;
  message_content?: string | null;
  message_type?: string | null;
  message_created_at?: string | null;
}
