import { db } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { Report, ReportTargetType } from "../models/Report.model";
import { ServiceError } from "./cocktail.service";
import { removePublishedCocktail, deleteAnyComment } from "./adminModeration.service";
import { createNotification } from "./notificationEvent.service";

interface CreateReportInput {
  reporterUserId: number;
  targetType: ReportTargetType;
  targetId: number;
  reason: string;
  details?: string | null;
}

const validateTargetExists = async (
  targetType: ReportTargetType,
  targetId: number,
) => {
  if (!Number.isInteger(targetId)) {
    throw new ServiceError("Invalid target id", 400);
  }

  if (targetType === "public_cocktail") {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT id FROM public_cocktails WHERE id = ?",
      [targetId],
    );

    if (rows.length === 0) {
      throw new ServiceError("Public cocktail not found", 404);
    }

    return;
  }

  if (targetType === "comment") {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT id FROM cocktail_comments WHERE id = ?",
      [targetId],
    );

    if (rows.length === 0) {
      throw new ServiceError("Comment not found", 404);
    }

    return;
  }

  throw new ServiceError("Invalid target type", 400);
};

export const createReport = async ({
  reporterUserId,
  targetType,
  targetId,
  reason,
  details = null,
}: CreateReportInput): Promise<number> => {
  if (!reason || !reason.trim()) {
    throw new ServiceError("Reason is required", 400);
  }

  await validateTargetExists(targetType, targetId);

  const [existing] = await db.query<RowDataPacket[]>(
    `SELECT id
     FROM reports
     WHERE reporter_user_id = ? AND target_type = ? AND target_id = ? AND status = 'open'`,
    [reporterUserId, targetType, targetId],
  );

  if (existing.length > 0) {
    throw new ServiceError(
      "You already have an open report for this target",
      409,
    );
  }

  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO reports
      (reporter_user_id, target_type, target_id, reason, details)
     VALUES (?, ?, ?, ?, ?)`,
    [
      reporterUserId,
      targetType,
      targetId,
      reason.trim(),
      details?.trim() || null,
    ],
  );

  return result.insertId;
};

export const getAllReports = async (): Promise<Report[]> => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT
        r.*,
        reporter.nickname AS reporter_nickname,
        reviewer.nickname AS reviewed_by_nickname
     FROM reports r
     JOIN users reporter ON r.reporter_user_id = reporter.id
     LEFT JOIN users reviewer ON r.reviewed_by = reviewer.id
     ORDER BY r.status ASC, r.created_at DESC, r.id DESC`,
  );

  return rows as Report[];
};

export const markReportReviewed = async (
  adminUserId: number,
  reportId: number,
): Promise<void> => {
  if (!Number.isInteger(reportId)) {
    throw new ServiceError("Invalid report id", 400);
  }

  const [result] = await db.query<ResultSetHeader>(
    `UPDATE reports
     SET status = 'reviewed',
         reviewed_by = ?,
         reviewed_at = NOW()
     WHERE id = ?`,
    [adminUserId, reportId],
  );

  if (result.affectedRows === 0) {
    throw new ServiceError("Report not found", 404);
  }
};

export const hidePublicCocktailFromReport = async (
  adminUserId: number,
  reportId: number,
  adminReason: string
): Promise<void> => {
  if (!Number.isInteger(reportId)) {
    throw new ServiceError("Invalid report id", 400);
  }

  if (!adminReason || !adminReason.trim()) {
    throw new ServiceError("Admin reason is required", 400);
  }

  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM reports WHERE id = ?",
    [reportId],
  );

  if (rows.length === 0) {
    throw new ServiceError("Report not found", 404);
  }

  const report = rows[0] as Report;

  if (report.target_type !== "public_cocktail") {
    throw new ServiceError("This report is not for a public cocktail", 409);
  }

  const [publicCocktailRows] = await db.query<RowDataPacket[]>(
    "SELECT author_id, id, source_cocktail_id FROM public_cocktails WHERE id = ?",
    [Number(report.target_id)]
  );

  if (publicCocktailRows.length === 0) {
    throw new ServiceError("Public cocktail not found", 404);
  }

  const publicCocktail = publicCocktailRows[0] as {
    author_id: number;
    id: number;
    source_cocktail_id: number;
  };

  await removePublishedCocktail(
    adminUserId,
    publicCocktail.source_cocktail_id,
    adminReason.trim()
  );

  await createNotification({
    userId: Number(publicCocktail.author_id),
    type: "report_public_cocktail_removed",
    actorUserId: adminUserId,
    recipeId: String(publicCocktail.id),
    recipeType: "public",
    commentId: null,
    adminReason: adminReason.trim(),
  });

  await db.query<ResultSetHeader>(
    `UPDATE reports
     SET status = 'reviewed',
         reviewed_by = ?,
         reviewed_at = NOW(),
         admin_reason = ?
     WHERE id = ?`,
    [adminUserId, adminReason.trim(), reportId]
  );
};

export const deleteCommentFromReport = async (
  adminUserId: number,
  reportId: number,
  adminReason: string
): Promise<void> => {
  if (!Number.isInteger(reportId)) {
    throw new ServiceError("Invalid report id", 400);
  }

  if (!adminReason || !adminReason.trim()) {
    throw new ServiceError("Admin reason is required", 400);
  }

  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM reports WHERE id = ?",
    [reportId]
  );

  if (rows.length === 0) {
    throw new ServiceError("Report not found", 404);
  }

  const report = rows[0] as Report;

  if (report.target_type !== "comment") {
    throw new ServiceError("This report is not for a comment", 409);
  }

  const [commentRows] = await db.query<RowDataPacket[]>(
    `SELECT user_id, cocktail_id, cocktail_type
     FROM cocktail_comments
     WHERE id = ?`,
    [Number(report.target_id)]
  );

  if (commentRows.length === 0) {
    throw new ServiceError("Comment not found", 404);
  }

  const comment = commentRows[0] as {
    user_id: number;
    cocktail_id: string;
    cocktail_type: "catalog" | "public";
  };

  await createNotification({
    userId: Number(comment.user_id),
    type: "report_comment_deleted",
    actorUserId: adminUserId,
    recipeId: String(comment.cocktail_id),
    recipeType: comment.cocktail_type,
    commentId: null,
    adminReason: adminReason.trim(),
  });

  await deleteAnyComment(Number(report.target_id));

  await db.query<ResultSetHeader>(
    `UPDATE reports
     SET status = 'reviewed',
         reviewed_by = ?,
         reviewed_at = NOW(),
         admin_reason = ?
     WHERE id = ?`,
    [adminUserId, adminReason.trim(), reportId]
  );
};