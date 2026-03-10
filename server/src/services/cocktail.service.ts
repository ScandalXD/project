import { db } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { CatalogCocktail } from "../models/CatalogCocktail.model";
import { PublicCocktail } from "../models/PublicCocktail.model";
import { UserCocktail } from "../models/UserCocktail.model";

class ServiceError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export const getCatalogCocktails = async (): Promise<CatalogCocktail[]> => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM catalog_cocktails"
  );
  return rows as CatalogCocktail[];
};

export const getPublicCocktails = async (): Promise<PublicCocktail[]> => {
  const [rows] = await db.query<RowDataPacket[]>(
    `
    SELECT
      p.id,
      p.author_id,
      u.nickname AS author_nickname,
      p.name,
      p.category,
      p.ingredients,
      p.instructions,
      p.image,
      p.created_at
    FROM public_cocktails p
    INNER JOIN users u ON p.author_id = u.id
    ORDER BY p.created_at DESC
    `
  );

  return rows as PublicCocktail[];
};

export const getUserCocktails = async (
  userId: number
): Promise<UserCocktail[]> => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM user_cocktails WHERE owner_id = ?",
    [userId]
  );
  return rows as UserCocktail[];
};

export const addCocktail = async (
  data: Omit<UserCocktail, "id" | "created_at">
): Promise<void> => {
  await db.query<ResultSetHeader>(
    `
    INSERT INTO user_cocktails
    (name, category, ingredients, instructions, image, owner_id)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      data.name,
      data.category,
      data.ingredients,
      data.instructions,
      data.image,
      data.owner_id,
    ]
  );
};

export const updateCocktail = async (
  cocktailId: number,
  userId: number,
  data: Pick<
    UserCocktail,
    "name" | "category" | "ingredients" | "instructions" | "image"
  >
): Promise<void> => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT id FROM user_cocktails WHERE id = ? AND owner_id = ?",
    [cocktailId, userId]
  );

  if (rows.length === 0) {
    throw new ServiceError(403, "You cannot edit this cocktail");
  }

  await db.query(
    `
    UPDATE user_cocktails
    SET name=?, category=?, ingredients=?, instructions=?, image=?
    WHERE id=?
    `,
    [
      data.name,
      data.category,
      data.ingredients,
      data.instructions,
      data.image,
      cocktailId,
    ]
  );
};

export const publishUserCocktail = async (
  cocktailId: number,
  userId: number
): Promise<void> => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM user_cocktails WHERE id = ? AND owner_id = ?",
    [cocktailId, userId]
  );

  if (rows.length === 0) {
    throw new ServiceError(403, "You cannot publish this cocktail");
  }

  const cocktail = rows[0] as UserCocktail;

  const [exists] = await db.query<RowDataPacket[]>(
    "SELECT id FROM public_cocktails WHERE author_id = ? AND name = ?",
    [userId, cocktail.name]
  );

  if (exists.length > 0) {
    throw new ServiceError(409, "Cocktail already published");
  }

  await db.query<ResultSetHeader>(
    `
    INSERT INTO public_cocktails
    (name, category, ingredients, instructions, image, author_id)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      cocktail.name,
      cocktail.category,
      cocktail.ingredients,
      cocktail.instructions,
      cocktail.image,
      userId,
    ]
  );
};

export const deleteCocktail = async (
  cocktailId: number,
  userId: number
): Promise<void> => {
  const [result] = await db.query<ResultSetHeader>(
    "DELETE FROM user_cocktails WHERE id = ? AND owner_id = ?",
    [cocktailId, userId]
  );

  if (result.affectedRows === 0) {
    throw new ServiceError(403, "You cannot delete this cocktail");
  }
};

export const deletePublicCocktail = async (
  cocktailId: number,
  userId: number
): Promise<void> => {
  const [result] = await db.query<ResultSetHeader>(
    `
    DELETE FROM public_cocktails
    WHERE id = ? AND author_id = ?
    `,
    [cocktailId, userId]
  );

  if (result.affectedRows === 0) {
    throw new ServiceError(403, "You cannot delete this public cocktail");
  }
};

export { ServiceError };
