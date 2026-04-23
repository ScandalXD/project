import { db } from "../config/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { ServiceError } from "./cocktail.service";
import { deleteUploadedFile } from "../utils/file.util";

export interface AdminCatalogData {
  id: string;
  name: string;
  category: "Alkoholowy" | "Bezalkoholowy";
  ingredients: string;
  instructions: string;
  image: string | null;
}

export interface UpdateAdminCatalogData {
  name: string;
  category: "Alkoholowy" | "Bezalkoholowy";
  ingredients: string;
  instructions: string;
  image: string | null;
}

export const addCatalogCocktail = async (
  data: AdminCatalogData
): Promise<void> => {
  const { id, name, category, ingredients, instructions, image } = data;

  if (!id || !name || !category || !ingredients || !instructions) {
    throw new ServiceError("Missing required fields", 400);
  }

  const [existing] = await db.query<RowDataPacket[]>(
    "SELECT id FROM catalog_cocktails WHERE id = ?",
    [id]
  );

  if (existing.length > 0) {
    throw new ServiceError("Catalog cocktail with this id already exists", 409);
  }

  await db.query<ResultSetHeader>(
    `INSERT INTO catalog_cocktails
      (id, name, category, ingredients, instructions, image)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, name, category, ingredients, instructions, image]
  );
};

export const updateCatalogCocktail = async (
  id: string,
  data: UpdateAdminCatalogData
): Promise<void> => {
  const { name, category, ingredients, instructions, image } = data;

  if (!id || !name || !category || !ingredients || !instructions) {
    throw new ServiceError("Missing required fields", 400);
  }

  const [existing] = await db.query<RowDataPacket[]>(
    "SELECT * FROM catalog_cocktails WHERE id = ?",
    [id]
  );

  if (existing.length === 0) {
    throw new ServiceError("Catalog cocktail not found", 404);
  }

  const cocktail = existing[0] as AdminCatalogData;

  const shouldDeleteOldImage =
    cocktail.image &&
    image &&
    cocktail.image !== image &&
    cocktail.image.startsWith("/uploads/");

  await db.query(
    `UPDATE catalog_cocktails
     SET name = ?, category = ?, ingredients = ?, instructions = ?, image = ?
     WHERE id = ?`,
    [name, category, ingredients, instructions, image, id]
  );

  if (shouldDeleteOldImage) {
    await deleteUploadedFile(cocktail.image);
  }
};

export const deleteCatalogCocktail = async (id: string): Promise<void> => {
  if (!id) {
    throw new ServiceError("Catalog cocktail id is required", 400);
  }

  const [existing] = await db.query<RowDataPacket[]>(
    "SELECT * FROM catalog_cocktails WHERE id = ?",
    [id]
  );

  if (existing.length === 0) {
    throw new ServiceError("Catalog cocktail not found", 404);
  }

  const cocktail = existing[0] as AdminCatalogData;

  await db.query(
    "DELETE FROM favorites WHERE cocktail_id = ? AND cocktail_type = 'catalog'",
    [id]
  );

  await db.query("DELETE FROM catalog_cocktails WHERE id = ?", [id]);

  await deleteUploadedFile(cocktail.image);
};