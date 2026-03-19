import { db } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { CocktailComment, CocktailType } from "../models/Comment.model";
import { ServiceError } from "./cocktail.service";

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

export const addComment = async (
  userId: number,
  cocktailId: string,
  cocktailType: CocktailType,
  content: string
): Promise<number> => {
  await validateCocktailExists(cocktailId, cocktailType);

  if (!content || !content.trim()) {
    throw new ServiceError("Comment content is required", 400);
  }

  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO cocktail_comments (user_id, cocktail_id, cocktail_type, content)
     VALUES (?, ?, ?, ?)`,
    [userId, cocktailId, cocktailType, content.trim()]
  );

  return result.insertId;
};

export const getComments = async (
  cocktailId: string,
  cocktailType: CocktailType
): Promise<CocktailComment[]> => {
  await validateCocktailExists(cocktailId, cocktailType);

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT cc.*, u.nickname AS author_nickname
     FROM cocktail_comments cc
     JOIN users u ON cc.user_id = u.id
     WHERE cc.cocktail_id = ? AND cc.cocktail_type = ?
     ORDER BY cc.created_at ASC`,
    [cocktailId, cocktailType]
  );

  return rows as CocktailComment[];
};

export const deleteComment = async (
  userId: number,
  commentId: number
): Promise<void> => {
  if (!Number.isInteger(commentId)) {
    throw new ServiceError("Invalid comment id", 400);
  }

  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM cocktail_comments WHERE id = ?",
    [commentId]
  );

  if (rows.length === 0) {
    throw new ServiceError("Comment not found", 404);
  }

  const comment = rows[0] as CocktailComment;

  if (Number(comment.user_id) !== Number(userId)) {
    throw new ServiceError("Forbidden", 403);
  }

  await db.query("DELETE FROM cocktail_comments WHERE id = ?", [commentId]);
};