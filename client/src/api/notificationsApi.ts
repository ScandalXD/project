import { api } from "./axios";

export type NotificationType =
  | "mention"
  | "cocktail_like"
  | "cocktail_comment"
  | "comment_like"
  | "comment_reply"
  | "report_public_cocktail_removed"
  | "report_comment_deleted";

export interface NotificationItem {
  id: number;
  user_id: number;
  type: NotificationType;
  actor_user_id: number;
  recipe_id: string;
  recipe_type: "catalog" | "public";
  comment_id: number | null;
  is_read: boolean;
  created_at: string;
  actor_nickname?: string;
  comment_content?: string | null;
  admin_reason?: string | null;
}

export const notificationsApi = {
  async getNotifications(): Promise<NotificationItem[]> {
    const res = await api.get("/notifications");
    return res.data;
  },

  async markAsRead(id: number) {
    return api.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead() {
    return api.patch("/notifications/read-all");
  },
};