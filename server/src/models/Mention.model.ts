export interface CommentMention {
  id: number;
  comment_id: number;
  mentioned_user_id: number;
  mentioned_by_user_id: number;
  created_at: string;
  is_read: boolean;
}