import { db } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { CocktailType } from "../models/Like.model";
import { ServiceError } from "./cocktail.service";
import { createNotification } from "./notificationEvent.service";

const validateCocktailType = (cocktailType: CocktailType) => {
  if (cocktailType !== "catalog" && cocktailType !== "public") {
    throw new ServiceError("Invalid cocktail type", 400);
  }
};

const validateCocktailExists = async (
  cocktailId: string,
  cocktailType: CocktailType
) => {
  validateCocktailType(cocktailType);

  if (!cocktailId) {
    throw new ServiceError("Cocktail id is required", 400);
  }

  const tableName =
    cocktailType === "catalog" ? "catalog_cocktails" : "public_cocktails";

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id FROM ${tableName} WHERE id = ?`,
    [cocktailId]
  );

  if (rows.length === 0) {
    throw new ServiceError("Cocktail not found", 404);
  }
};

export const addLike = async (
  userId: number,
  cocktailId: string,
  cocktailType: CocktailType
): Promise<void> => {
  await validateCocktailExists(cocktailId, cocktailType);

  const [existing] = await db.query<RowDataPacket[]>(
    `SELECT user_id FROM cocktail_likes
     WHERE user_id = ? AND cocktail_id = ? AND cocktail_type = ?`,
    [userId, cocktailId, cocktailType]
  );

  if (existing.length > 0) {
    throw new ServiceError("Cocktail already liked", 409);
  }

  await db.query<ResultSetHeader>(
    `INSERT INTO cocktail_likes (user_id, cocktail_id, cocktail_type)
     VALUES (?, ?, ?)`,
    [userId, cocktailId, cocktailType]
  );

  if (cocktailType === "public") {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, author_id
       FROM public_cocktails
       WHERE id = ?`,
      [cocktailId]
    );

    if (rows.length > 0) {
      const cocktail = rows[0] as { id: number; author_id: number };

      await createNotification({
        userId: Number(cocktail.author_id),
        type: "cocktail_like",
        actorUserId: userId,
        recipeId: String(cocktailId),
        recipeType: "public",
        commentId: null,
      });
    }
  }
};

export const removeLike = async (
  userId: number,
  cocktailId: string,
  cocktailType: CocktailType
): Promise<void> => {
  validateCocktailType(cocktailType);

  const [result] = await db.query<ResultSetHeader>(
    `DELETE FROM cocktail_likes
     WHERE user_id = ? AND cocktail_id = ? AND cocktail_type = ?`,
    [userId, cocktailId, cocktailType]
  );

  if (result.affectedRows === 0) {
    throw new ServiceError("Like not found", 404);
  }
};

export const getLikesCount = async (
  cocktailId: string,
  cocktailType: CocktailType
): Promise<number> => {
  await validateCocktailExists(cocktailId, cocktailType);

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS count
     FROM cocktail_likes
     WHERE cocktail_id = ? AND cocktail_type = ?`,
    [cocktailId, cocktailType]
  );

  return Number(rows[0].count);
};

export const isLikedByUser = async (
  userId: number,
  cocktailId: string,
  cocktailType: CocktailType
): Promise<boolean> => {
  validateCocktailType(cocktailType);

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT user_id
     FROM cocktail_likes
     WHERE user_id = ? AND cocktail_id = ? AND cocktail_type = ?`,
    [userId, cocktailId, cocktailType]
  );

  return rows.length > 0;
};