import { db } from "../config/db";

export const getCatalogCocktails = async () => {
  const [rows] = await db.query("SELECT * FROM catalog_cocktails");
  return rows;
};

export const getPublicCocktails = async () => {
  const [rows] = await db.query("SELECT * FROM public_cocktails");
  return rows;
};

export const addCocktail = async (
  name: string,
  category: string,
  image: string,
  ingredients: string,
  instructions: string,
  userId: number
) => {
  await db.query(
    `INSERT INTO user_cocktails
     (name, category, image, ingredients, instructions, owner_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, category, image, ingredients, instructions, userId]
  );
};

export const getUserCocktails = async (userId: number) => {
  const [rows] = await db.query(
    "SELECT * FROM user_cocktails WHERE owner_id = ?",
    [userId]
  );
  return rows;
};

export const deleteCocktail = async (id: number, userId: number) => {
  await db.query(
    "DELETE FROM user_cocktails WHERE id = ? AND owner_id = ?",
    [id, userId]
  );
};