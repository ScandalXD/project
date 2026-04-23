import { db } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { UserCocktail } from "../models/UserCocktail.model";
import { PublicCocktail } from "../models/PublicCocktail.model";
import { ServiceError } from "./cocktail.service";

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

export const getPendingCocktails = async (): Promise<PendingCocktail[]> => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT uc.*, u.nickname AS owner_nickname, u.name AS owner_name, u.email AS owner_email
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

  const [existingPublic] = await db.query<RowDataPacket[]>(
    "SELECT id FROM public_cocktails WHERE source_cocktail_id = ?",
    [cocktailId],
  );

  if (existingPublic.length > 0) {
    throw new ServiceError("Public version already exists", 409);
  }

  await db.query("START TRANSACTION");

  try {
    await db.query(
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

    await db.query(
      `UPDATE user_cocktails
       SET publication_status = 'approved',
           moderation_reason = NULL,
           moderated_at = NOW(),
           moderated_by = ?
       WHERE id = ?`,
      [adminId, cocktailId],
    );

    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
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
};

export const cancelModeration = async (
  adminId: number,
  cocktailId: number,
  reason: string,
): Promise<void> => {
  if (!Number.isInteger(cocktailId)) {
    throw new ServiceError("Invalid cocktail id", 400);
  }

  if (!reason || !reason.trim()) {
    throw new ServiceError("Return reason is required", 400);
  }

  const cocktail = await getPendingCocktailById(cocktailId);

  if (cocktail.publication_status !== "pending") {
    throw new ServiceError(
      "Only pending cocktails can have moderation cancelled",
      409,
    );
  }

  await db.query(
    `UPDATE user_cocktails
     SET publication_status = 'draft',
         moderation_reason = ?,
         submitted_at = NULL,
         moderated_at = NOW(),
         moderated_by = ?
     WHERE id = ?`,
    [reason.trim(), adminId, cocktailId],
  );
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

  await db.query("START TRANSACTION");

  try {
    await db.query(
      "DELETE FROM favorites WHERE cocktail_id = ? AND cocktail_type = 'public'",
      [String(cocktailId)],
    );

    await db.query(
      "DELETE FROM public_cocktails WHERE source_cocktail_id = ?",
      [cocktailId],
    );

    await db.query(
      `UPDATE user_cocktails
     SET publication_status = 'rejected',
         moderation_reason = ?,
         moderated_at = NOW(),
         moderated_by = ?
     WHERE id = ?`,
      [reason.trim(), adminId, cocktailId],
    );

    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
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

export const deleteAnyComment = async (commentId: number): Promise<void> => {
  if (!Number.isInteger(commentId)) {
    throw new ServiceError("Invalid comment id", 400);
  }

  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT id FROM cocktail_comments WHERE id = ?",
    [commentId],
  );

  if (rows.length === 0) {
    throw new ServiceError("Comment not found", 404);
  }

  await db.query<ResultSetHeader>(
    "DELETE FROM cocktail_comments WHERE id = ?",
    [commentId],
  );
};