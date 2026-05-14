import { db } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { UserCocktail } from "../models/UserCocktail.model";
import { PublicCocktail } from "../models/PublicCocktail.model";
import { ServiceError } from "./cocktail.service";
import { createNotification } from "./notificationEvent.service";

interface PendingCocktail extends UserCocktail {
  owner_nickname: string;
  owner_name: string;
  owner_email: string;
}

const getPendingCocktailById = async (
  cocktailId: number,
): Promise<UserCocktail> => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM user_cocktails WHERE id = ?",
    [cocktailId],
  );

  if (rows.length === 0) {
    throw new ServiceError("Cocktail not found", 404);
  }

  return rows[0] as UserCocktail;
};

const getPublicCocktailCommentIds = async (
  publicCocktailId: number,
): Promise<number[]> => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT id FROM cocktail_comments WHERE cocktail_id = ? AND cocktail_type = 'public'",
    [String(publicCocktailId)],
  );

  return rows.map((row) => Number(row.id));
};

const closeReportsForPublicCocktail = async (
  adminId: number,
  publicCocktailId: number,
  commentIds: number[],
  reason: string,
): Promise<void> => {
  await db.query(
    `UPDATE reports
     SET status = 'reviewed',
         reviewed_by = ?,
         reviewed_at = NOW(),
         admin_reason = ?
     WHERE target_type = 'public_cocktail'
       AND target_id = ?`,
    [adminId, reason, publicCocktailId],
  );

  if (commentIds.length > 0) {
    await db.query(
      `UPDATE reports
       SET status = 'reviewed',
           reviewed_by = ?,
           reviewed_at = NOW(),
           admin_reason = ?
       WHERE target_type = 'comment'
         AND target_id IN (?)`,
      [adminId, reason, commentIds],
    );
  }
};

const cleanupPublicCocktailRelations = async (
  publicCocktailId: number,
  commentIds: number[],
): Promise<void> => {
  if (commentIds.length > 0) {
    await db.query("DELETE FROM notifications WHERE comment_id IN (?)", [
      commentIds,
    ]);

    await db.query("DELETE FROM comment_likes WHERE comment_id IN (?)", [
      commentIds,
    ]);

    await db.query("DELETE FROM comment_mentions WHERE comment_id IN (?)", [
      commentIds,
    ]);

    await db.query("DELETE FROM cocktail_comments WHERE id IN (?)", [
      commentIds,
    ]);
  }

  await db.query(
    "DELETE FROM cocktail_likes WHERE cocktail_id = ? AND cocktail_type = 'public'",
    [String(publicCocktailId)],
  );

  await db.query(
    "DELETE FROM favorites WHERE cocktail_id = ? AND cocktail_type = 'public'",
    [String(publicCocktailId)],
  );
};

export const getPendingCocktails = async (): Promise<PendingCocktail[]> => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT uc.*, u.nickname AS owner_nickname, u.email AS owner_email
     FROM user_cocktails uc
     JOIN users u ON uc.owner_id = u.id
     WHERE uc.publication_status = 'pending'
     ORDER BY uc.submitted_at ASC, uc.created_at ASC`,
  );

  return rows as PendingCocktail[];
};

export const approveCocktail = async (
  adminId: number,
  cocktailId: number,
): Promise<void> => {
  if (!Number.isInteger(cocktailId)) {
    throw new ServiceError("Invalid cocktail id", 400);
  }

  const cocktail = await getPendingCocktailById(cocktailId);

  if (cocktail.publication_status !== "pending") {
    throw new ServiceError("Only pending cocktails can be approved", 409);
  }

  let publicCocktailId: number;

  await db.query("START TRANSACTION");

  try {
    await db.query(
      `UPDATE user_cocktails
       SET publication_status = 'approved',
           moderated_at = NOW(),
           moderated_by = ?
       WHERE id = ?`,
      [adminId, cocktailId],
    );

    const [publicResult] = await db.query<ResultSetHeader>(
      `INSERT INTO public_cocktails
       (source_cocktail_id, author_id, name, category, ingredients, instructions, image)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        cocktail.id,
        cocktail.owner_id,
        cocktail.name,
        cocktail.category,
        cocktail.ingredients,
        cocktail.instructions,
        cocktail.image,
      ],
    );

    publicCocktailId = Number(publicResult.insertId);

    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }

  await createNotification({
    userId: cocktail.owner_id,
    type: "cocktail_approved",
    actorUserId: adminId,
    recipeId: String(publicCocktailId),
    recipeType: "public",
    commentId: null,
    adminReason: null,
  });
};

export const rejectCocktail = async (
  adminId: number,
  cocktailId: number,
  reason: string,
): Promise<void> => {
  if (!Number.isInteger(cocktailId)) {
    throw new ServiceError("Invalid cocktail id", 400);
  }

  if (!reason || !reason.trim()) {
    throw new ServiceError("Rejection reason is required", 400);
  }

  const cocktail = await getPendingCocktailById(cocktailId);

  if (cocktail.publication_status !== "pending") {
    throw new ServiceError("Only pending cocktails can be rejected", 409);
  }

  await db.query(
    `UPDATE user_cocktails
     SET publication_status = 'rejected',
         moderation_reason = ?,
         moderated_at = NOW(),
         moderated_by = ?
     WHERE id = ?`,
    [reason.trim(), adminId, cocktailId],
  );

  await createNotification({
    userId: cocktail.owner_id,
    type: "cocktail_rejected",
    actorUserId: adminId,
    recipeId: String(cocktail.id),
    recipeType: "user",
    commentId: null,
    adminReason: reason.trim(),
  });
};

export const removePublishedCocktail = async (
  adminId: number,
  cocktailId: number,
  reason: string,
): Promise<void> => {
  if (!Number.isInteger(cocktailId)) {
    throw new ServiceError("Invalid cocktail id", 400);
  }

  if (!reason || !reason.trim()) {
    throw new ServiceError("Removal reason is required", 400);
  }

  const [publicRows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM public_cocktails WHERE source_cocktail_id = ?",
    [cocktailId],
  );

  if (publicRows.length === 0) {
    throw new ServiceError("Published cocktail not found", 404);
  }

  const publicCocktail = publicRows[0] as PublicCocktail;

  const [userRows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM user_cocktails WHERE id = ?",
    [cocktailId],
  );

  if (userRows.length === 0) {
    throw new ServiceError("Cocktail not found", 404);
  }

  const userCocktail = userRows[0] as UserCocktail;

  if (userCocktail.publication_status !== "approved") {
    throw new ServiceError(
      "Only approved cocktails can be removed from publication",
      409,
    );
  }

  const publicCocktailId = Number(publicCocktail.id);
  const commentIds = await getPublicCocktailCommentIds(publicCocktailId);
  const adminReason = reason.trim();

  await db.query("START TRANSACTION");

  try {
    await closeReportsForPublicCocktail(
      adminId,
      publicCocktailId,
      commentIds,
      "Target cocktail was removed by admin.",
    );

    await cleanupPublicCocktailRelations(publicCocktailId, commentIds);

    await db.query("DELETE FROM public_cocktails WHERE id = ?", [
      publicCocktailId,
    ]);

    await db.query(
      `UPDATE user_cocktails
       SET publication_status = 'rejected',
           moderation_reason = ?,
           moderated_at = NOW(),
           moderated_by = ?
       WHERE id = ?`,
      [adminReason, adminId, cocktailId],
    );

    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }

  await createNotification({
    userId: Number(publicCocktail.author_id),
    type: "public_cocktail_deleted",
    actorUserId: adminId,
    recipeId: String(publicCocktail.source_cocktail_id),
    recipeType: "user",
    commentId: null,
    adminReason,
  });
};

export const getPublishedCocktailsForAdmin = async (): Promise<
  PublicCocktail[]
> => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT pc.*, u.nickname AS author_nickname
     FROM public_cocktails pc
     JOIN users u ON pc.author_id = u.id
     ORDER BY pc.created_at DESC`,
  );

  return rows as PublicCocktail[];
};

export const deleteAnyComment = async (
  adminId: number,
  commentId: number,
  reason: string,
): Promise<void> => {
  if (!Number.isInteger(commentId)) {
    throw new ServiceError("Invalid comment id", 400);
  }

  if (!reason || !reason.trim()) {
    throw new ServiceError("Admin reason is required", 400);
  }

  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT id, user_id, cocktail_id, cocktail_type FROM cocktail_comments WHERE id = ?",
    [commentId],
  );

  if (rows.length === 0) {
    throw new ServiceError("Comment not found", 404);
  }

  const comment = rows[0] as {
    id: number;
    user_id: number;
    cocktail_id: string;
    cocktail_type: "catalog" | "public";
  };

  const [commentRows] = await db.query<RowDataPacket[]>(
    "SELECT id FROM cocktail_comments WHERE id = ? OR parent_comment_id = ?",
    [commentId, commentId],
  );

  const commentIds = commentRows.map((row) => Number(row.id));
  const adminReason = reason.trim();

  await db.query("START TRANSACTION");

  try {
    await db.query(
      `UPDATE reports
       SET status = 'reviewed',
           reviewed_by = ?,
           reviewed_at = NOW(),
           admin_reason = ?
       WHERE target_type = 'comment'
         AND target_id IN (?)`,
      [adminId, "Target comment was deleted by admin.", commentIds],
    );

    await db.query("DELETE FROM notifications WHERE comment_id IN (?)", [
      commentIds,
    ]);

    await db.query("DELETE FROM comment_likes WHERE comment_id IN (?)", [
      commentIds,
    ]);

    await db.query("DELETE FROM comment_mentions WHERE comment_id IN (?)", [
      commentIds,
    ]);

    await db.query<ResultSetHeader>(
      "DELETE FROM cocktail_comments WHERE id IN (?)",
      [commentIds],
    );

    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }

  await createNotification({
    userId: Number(comment.user_id),
    type: "admin_comment_deleted",
    actorUserId: adminId,
    recipeId: String(comment.cocktail_id),
    recipeType: comment.cocktail_type,
    commentId: null,
    adminReason,
  });
};

export const deletePublicCocktailById = async (
  adminId: number,
  publicCocktailId: number,
  reason: string,
): Promise<void> => {
  if (!Number.isInteger(publicCocktailId)) {
    throw new ServiceError("Invalid public cocktail id", 400);
  }

  if (!reason || !reason.trim()) {
    throw new ServiceError("Admin reason is required", 400);
  }

  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM public_cocktails WHERE id = ?",
    [publicCocktailId],
  );

  if (rows.length === 0) {
    throw new ServiceError("Public cocktail not found", 404);
  }

  const publicCocktail = rows[0] as PublicCocktail;
  const commentIds = await getPublicCocktailCommentIds(publicCocktailId);
  const adminReason = reason.trim();

  await db.query("START TRANSACTION");

  try {
    await closeReportsForPublicCocktail(
      adminId,
      publicCocktailId,
      commentIds,
      "Target cocktail was removed by admin.",
    );

    await cleanupPublicCocktailRelations(publicCocktailId, commentIds);

    await db.query("DELETE FROM public_cocktails WHERE id = ?", [
      publicCocktailId,
    ]);

    await db.query(
      `UPDATE user_cocktails
       SET publication_status = 'rejected',
           moderation_reason = ?,
           moderated_at = NOW(),
           moderated_by = ?
       WHERE id = ?`,
      [adminReason, adminId, publicCocktail.source_cocktail_id],
    );

    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }

  await createNotification({
    userId: Number(publicCocktail.author_id),
    type: "public_cocktail_deleted",
    actorUserId: adminId,
    recipeId: String(publicCocktail.source_cocktail_id),
    recipeType: "user",
    commentId: null,
    adminReason,
  });
};