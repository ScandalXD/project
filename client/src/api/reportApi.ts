import { api } from "./axios";
import type { ReportItem } from "../types/report";

export const reportApi = {
  async reportCocktail(cocktailId: number, reason: string) {
    const res = await api.post("/reports", {
      targetType: "public_cocktail",
      targetId: cocktailId,
      reason,
    });

    return res.data;
  },

  async reportComment(commentId: number, reason: string) {
    const res = await api.post("/reports", {
      targetType: "comment",
      targetId: commentId,
      reason,
    });

    return res.data;
  },

  async getAdminReports(): Promise<ReportItem[]> {
    const res = await api.get("/admin/reports");
    return res.data;
  },

  async markReportReviewed(reportId: number) {
    const res = await api.patch(`/admin/reports/${reportId}/review`);
    return res.data;
  },

  async rejectReport(reportId: number, adminReason: string) {
    const res = await api.patch(`/admin/reports/${reportId}/reject`, {
      adminReason,
    });

    return res.data;
  },

  async hidePublicCocktailFromReport(reportId: number, adminReason: string) {
    const res = await api.patch(
      `/admin/reports/${reportId}/hide-public-cocktail`,
      { adminReason }
    );

    return res.data;
  },

  async deleteCommentFromReport(reportId: number, adminReason: string) {
    const res = await api.patch(
      `/admin/reports/${reportId}/delete-comment`,
      { adminReason }
    );

    return res.data;
  },

  async deleteReviewedReport(reportId: number) {
    const res = await api.delete(`/admin/reports/${reportId}`);
    return res.data;
  },
};