export type ReportTargetType = "public_cocktail" | "comment";
export type ReportStatus = "open" | "reviewed";

export interface ReportItem {
  id: number;
  reporter_user_id: number;
  target_type: ReportTargetType;
  target_id: number;
  reason: string;
  details: string | null;
  status: ReportStatus;
  reviewed_by: number | null;
  reviewed_at: string | null;
  admin_reason: string | null;
  created_at: string;
  reporter_nickname: string;
  reviewed_by_nickname?: string | null;

  comment_content?: string | null;
  comment_cocktail_id?: number | null;
  comment_cocktail_type?: "catalog" | "public" | null;
}