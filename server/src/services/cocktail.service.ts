import { db } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { UserCocktail, PublicationStatus } from "../models/UserCocktail.model";
import { CatalogCocktail } from "../models/CatalogCocktail.model";
import { PublicCocktail } from "../models/PublicCocktail.model";
import { deleteUploadedFile } from "../utils/file.util";

export class ServiceError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface CreateCocktailData {
  owner_id: number;
  name: string;
  category: "Alkoholowy" | "Bezalkoholowy";
  ingredients: string;
  instructions: string;
  image: string | null;
}

interface UpdateCocktailData {
  name: string;
  category: "Alkoholowy" | "Bezalkoholowy";
  ingredients: string;
  instructions: string;
  image: string | null;
}

const resetModerationToDraft = async (cocktailId: number) => {
  await db.query(
    `UPDATE user_cocktails
     SET publication_status = 'draft',
         moderation_reason = NULL,
         submitted_at = NULL,
         moderated_at = NULL,
         moderated_by = NULL
     WHERE id = ?`,
    [cocktailId],
  );
};

export const getCatalogCocktails = async (): Promise<CatalogCocktail[]> => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM catalog_cocktails ORDER BY created_at DESC",
  );

  return rows as CatalogCocktail[];
};

export const getPublicCocktails = async (): Promise<PublicCocktail[]> => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT pc.*, u.nickname AS author_nickname
     FROM public_cocktails pc
     JOIN users u ON pc.author_id = u.id
     ORDER BY pc.created_at DESC`,
  );

  return rows as PublicCocktail[];
};

export const getUserCocktails = async (
  userId: number,
): Promise<UserCocktail[]> => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM user_cocktails WHERE owner_id = ? ORDER BY created_at DESC",
    [userId],
  );

  return rows as UserCocktail[];
};

export const addCocktail = async (
  data: CreateCocktailData,
): Promise<number> => {
  const { owner_id, name, category, ingredients, instructions, image } = data;

  if (!name || !category || !ingredients || !instructions) {
    throw new ServiceError("Missing required fields", 400);
  }

  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO user_cocktails
      (owner_id, name, category, ingredients, instructions, image, publication_status)
     VALUES (?, ?, ?, ?, ?, ?, 'draft')`,
    [owner_id, name, category, ingredients, instructions, image],
  );

  return result.insertId;
};

export const updateCocktail = async (
  cocktailId: number,
  userId: number,
  data: UpdateCocktailData,
): Promise<void> => {
  if (!Number.isInteger(cocktailId)) {
    throw new ServiceError("Invalid cocktail id", 400);
  }

  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM user_cocktails WHERE id = ?",
    [cocktailId],
  );

  if (rows.length === 0) {
    throw new ServiceError("Cocktail not found", 404);
  }

  const cocktail = rows[0] as UserCocktail;

  if (cocktail.owner_id !== userId) {
    throw new ServiceError("Forbidden", 403);
  }

  if (cocktail.publication_status === "pending") {
    throw new ServiceError(
      "Cocktail is under moderation and cannot be edited",
      409,
    );
  }

  const { name, category, ingredients, instructions, image } = data;

  if (!name || !category || !ingredients || !instructions) {
    throw new ServiceError("Missing required fields", 400);
  }

  if (cocktail.publication_status === "approved") {
    await db.query(
      "DELETE FROM public_cocktails WHERE source_cocktail_id = ?",
      [cocktailId],
    );
    await resetModerationToDraft(cocktailId);
  }

  const shouldDeleteOldImage =
    cocktail.image &&
    image &&
    cocktail.image !== image &&
    cocktail.image.startsWith("/uploads/");

  await db.query(
    `UPDATE user_cocktails
     SET name = ?, category = ?, ingredients = ?, instructions = ?, image = ?
     WHERE id = ?`,
    [name, category, ingredients, instructions, image, cocktailId],
  );

  if (shouldDeleteOldImage) {
    await deleteUploadedFile(cocktail.image);
  }
};

export const deleteCocktail = async (
  cocktailId: number,
  userId: number
): Promise<void> => {
  if (!Number.isInteger(cocktailId)) {
    throw new ServiceError("Invalid cocktail id", 400);
  }

  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM user_cocktails WHERE id = ?",
    [cocktailId]
  );

  if (rows.length === 0) {
    throw new ServiceError("Cocktail not found", 404);
  }

  const cocktail = rows[0] as UserCocktail;

  if (cocktail.owner_id !== userId) {
    throw new ServiceError("Forbidden", 403);
  }

  await db.query(
    "DELETE FROM favorites WHERE cocktail_id = ? AND cocktail_type = 'public'",
    [String(cocktailId)]
  );

  await db.query("DELETE FROM public_cocktails WHERE source_cocktail_id = ?", [
    cocktailId,
  ]);

  await db.query("DELETE FROM user_cocktails WHERE id = ?", [cocktailId]);

  await deleteUploadedFile(cocktail.image);
};

export const publishUserCocktail = async (
  cocktailId: number,
  userId: number,
): Promise<void> => {
  if (!Number.isInteger(cocktailId)) {
    throw new ServiceError("Invalid cocktail id", 400);
  }

  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM user_cocktails WHERE id = ?",
    [cocktailId],
  );

  if (rows.length === 0) {
    throw new ServiceError("Cocktail not found", 404);
  }

  const cocktail = rows[0] as UserCocktail;

  if (cocktail.owner_id !== userId) {
    throw new ServiceError("Forbidden", 403);
  }

  if (cocktail.publication_status === "pending") {
    throw new ServiceError("Cocktail is already under moderation", 409);
  }

  if (cocktail.publication_status === "approved") {
    throw new ServiceError("Cocktail is already approved and published", 409);
  }

  await db.query(
    `UPDATE user_cocktails
     SET publication_status = 'pending',
         moderation_reason = NULL,
         submitted_at = NOW(),
         moderated_at = NULL,
         moderated_by = NULL
     WHERE id = ?`,
    [cocktailId],
  );
};

export const deletePublicCocktail = async (
  publicCocktailId: number,
  userId: number
): Promise<void> => {
  if (!Number.isInteger(publicCocktailId)) {
    throw new ServiceError("Invalid cocktail id", 400);
  }

  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM public_cocktails WHERE id = ?",
    [publicCocktailId]
  );

  if (rows.length === 0) {
    throw new ServiceError("Public cocktail not found", 404);
  }

  const cocktail = rows[0] as PublicCocktail;

  if (cocktail.author_id !== userId) {
    throw new ServiceError("Forbidden", 403);
  }

  await db.query(
    "DELETE FROM favorites WHERE cocktail_id = ? AND cocktail_type = 'public'",
    [String(publicCocktailId)]
  );

  await db.query("DELETE FROM public_cocktails WHERE id = ?", [
    publicCocktailId,
  ]);

  await resetModerationToDraft(cocktail.source_cocktail_id);
};

export const getPublicCocktailsByAuthor = async (
  authorId: number,
): Promise<PublicCocktail[]> => {
  if (!Number.isInteger(authorId)) {
    throw new ServiceError("Invalid author id", 400);
  }

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT pc.*, u.nickname AS author_nickname
     FROM public_cocktails pc
     JOIN users u ON pc.author_id = u.id
     WHERE pc.author_id = ?
     ORDER BY pc.created_at DESC`,
    [authorId],
  );

  return rows as PublicCocktail[];
};
