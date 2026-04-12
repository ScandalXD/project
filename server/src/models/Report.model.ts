export type ReportTargetType = "public_cocktail" | "comment";
export type ReportStatus = "open" | "reviewed";

export interface Report {
    id: number;
    reporter_user_id: number;
    target_type: ReportTargetType;
    target_id: number;
    reason: string;
    admin_reason: string | null;
    details: string | null;
    status: ReportStatus;
    reviewed_by: number | null;
    reviewed_at: string | null;
    created_at: string;
    reporter_nickname?: string;
    reviewed_by_nickname?: string | null;
}