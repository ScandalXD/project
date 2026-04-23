import { db } from "../config/db";
import { Favorite } from "../models/Favorite.model";
import { RowDataPacket } from "mysql2";

export const addFavorite = async (
  userId: number,
  cocktailId: string | number,
  cocktailType: "catalog" | "public"
): Promise<void> => {
  await db.query(
    `INSERT IGNORE INTO favorites (user_id, cocktail_id, cocktail_type)
     VALUES (?, ?, ?)`,
    [userId, cocktailId, cocktailType]
  );
};

export const removeFavorite = async (
  userId: number,
  cocktailId: string | number,
  cocktailType: "catalog" | "public"
): Promise<void> => {
  const [result]: any = await db.query(
    `DELETE FROM favorites
     WHERE user_id = ? AND cocktail_id = ? AND cocktail_type = ?`,
    [userId, cocktailId, cocktailType]
  );

  if (result.affectedRows === 0) {
    throw new Error("FORBIDDEN");
  }
};

export const getFavorites = async (userId: number): Promise<Favorite[]> => {
  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT
      f.cocktail_type,
      COALESCE(c.id, p.id) AS id,
      COALESCE(c.name, p.name) AS name,
      COALESCE(c.category, p.category) AS category,
      COALESCE(c.ingredients, p.ingredients) AS ingredients,
      COALESCE(c.instructions, p.instructions) AS instructions,
      COALESCE(c.image, p.image) AS image
    FROM favorites f
    LEFT JOIN catalog_cocktails c
      ON f.cocktail_type = 'catalog' AND f.cocktail_id = c.id
    LEFT JOIN public_cocktails p
      ON f.cocktail_type = 'public' AND f.cocktail_id = p.id
    WHERE f.user_id = ?
      AND (
        (f.cocktail_type = 'catalog' AND c.id IS NOT NULL)
        OR
        (f.cocktail_type = 'public' AND p.id IS NOT NULL)
      )
    ORDER BY f.created_at DESC
    `,
    [userId]
  );

  return rows as Favorite[];
};