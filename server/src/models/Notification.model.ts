export type NotificationType =
  | "mention"
  | "cocktail_like"
  | "cocktail_comment"
  | "comment_like"
  | "comment_reply";

export type RecipeType = "catalog" | "public";

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  actor_user_id: number;
  recipe_id: string;
  recipe_type: RecipeType;
  comment_id: number | null;
  is_read: boolean;
  created_at: string;
  actor_nickname?: string;
  comment_content?: string | null;
}