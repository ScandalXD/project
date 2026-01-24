import { Request, Response } from "express";
import { getCatalogCocktails } from "../services/cocktail.service";

export const getCatalogController = async (_req: Request, res: Response) => {
  try {
    const cocktails = await getCatalogCocktails();
    res.json(cocktails);
  } catch (error) {
    res.status(500).json({ message: "Failed to load cocktails catalog" });
  }
};
