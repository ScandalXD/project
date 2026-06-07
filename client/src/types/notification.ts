export type NotificationType =
  | "mention"
  | "cocktail_like"
  | "cocktail_comment"
  | "comment_like"
  | "comment_reply"
  | "cocktail_approved"
  | "cocktail_rejected"
  | "role_changed"
  | "public_cocktail_deleted"
  | "admin_comment_deleted"
  | "report_public_cocktail_removed"
  | "report_comment_deleted"
  | "report_rejected"
  | "friend_request_received"
  | "friend_request_accepted"
  | "new_message"
  | "cocktail_shared"
  | "admin_warning"
  | "chat_muted"
  | "chat_banned";

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  actor_user_id: number | null;
  recipe_id: string;
  recipe_type: "catalog" | "public" | "user";
  comment_id: number | null;
  is_read: boolean;
  created_at: string;
  actor_nickname?: string;
  comment_content?: string | null;
  admin_reason?: string | null;
}
