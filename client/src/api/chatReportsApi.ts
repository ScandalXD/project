import { api } from "./axios";
import type {
  ChatReport,
  ChatReportReason,
  ChatReportStatus,
  ChatReportTargetType,
} from "../types/chatReport";

export const chatReportsApi = {
  async createReport(data: {
    targetType: ChatReportTargetType;
    messageId?: number | null;
    targetUserId?: number | null;
    reason: ChatReportReason;
    details?: string | null;
  }) {
    const res = await api.post("/chat-reports", data);
    return res.data;
  },

  async getAdminReports(status?: ChatReportStatus): Promise<ChatReport[]> {
    const res = await api.get("/admin/chat-reports", {
      params: status ? { status } : undefined,
    });
    return res.data;
  },

  async dismiss(reportId: number, adminReason: string) {
    const res = await api.patch(`/admin/chat-reports/${reportId}/dismiss`, {
      adminReason,
    });
    return res.data;
  },

  async deleteMessage(reportId: number, adminReason: string) {
    const res = await api.patch(
      `/admin/chat-reports/${reportId}/delete-message`,
      { adminReason },
    );
    return res.data;
  },

  async warn(reportId: number, adminReason: string) {
    const res = await api.patch(`/admin/chat-reports/${reportId}/warn`, {
      adminReason,
    });
    return res.data;
  },

  async mute(reportId: number, adminReason: string, mutedUntil: string) {
    const res = await api.patch(`/admin/chat-reports/${reportId}/mute`, {
      adminReason,
      mutedUntil,
    });
    return res.data;
  },

  async ban(
    reportId: number,
    adminReason: string,
    isPermanent: boolean,
    bannedUntil?: string | null,
  ) {
    const res = await api.patch(`/admin/chat-reports/${reportId}/ban`, {
      adminReason,
      isPermanent,
      bannedUntil,
    });
    return res.data;
  },

  async deleteReviewedReport(reportId: number) {
    const res = await api.delete(`/admin/chat-reports/${reportId}`);
    return res.data;
  },
};
