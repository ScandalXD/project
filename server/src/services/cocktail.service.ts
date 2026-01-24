import { db } from "../config/db";

export const getCatalogCocktails = async () => {
  const [rows] = await db.query("SELECT * FROM catalog_cocktails");
  return rows;
};
