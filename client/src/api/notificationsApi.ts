import { api } from "./axios";
import type { Notification } from "../types/notification";

export const notificationsApi = {
  async getNotifications(): Promise<Notification[]> {
    const res = await api.get("/notifications");
    return res.data;
  },

  async markAsRead(id: number) {
    return api.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead() {
    return api.patch("/notifications/read-all");
  },

  async clearAll() {
  return api.delete("/notifications/clear-all");
},
};