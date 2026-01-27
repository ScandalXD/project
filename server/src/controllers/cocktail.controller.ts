import { Request, Response } from "express";
import { getCatalogCocktails, addCocktail, getPublicCocktails, deleteCocktail, getUserCocktails } from "../services/cocktail.service";


export const getCatalog = async (_req: Request, res: Response) => {
  try {
    const cocktails = await getCatalogCocktails();
    res.json(cocktails);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch catalog" });
  }
};
export const getPublic = async (_req: Request, res: Response) => {
  try {
    const cocktails = await getPublicCocktails();
    res.json(cocktails);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch public cocktails" });
  }
};

export const createCocktail = async (req: Request, res: Response) => {
  try {
    const { name, category, image, ingredients, instructions } = req.body;
    const userId = (req as any).user.id;
    await addCocktail(
      name,
      category,
      image,
      ingredients,
      instructions,
      userId
    );

    res.status(201).json({ message: "Cocktail added" });
  } catch (e) {
    res.status(500).json({ message: "Failed to add cocktail" });
  }
};


export const getMyCocktails = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const cocktails = await getUserCocktails(userId);
    res.json(cocktails);
  } catch (e) {
    res.status(500).json({ message: "Failed to load user cocktails" });
  }
};


export const removeCocktail = async (req: Request, res: Response) => {
  try {
    const cocktailId = Number(req.params.id);
    const userId = (req as any).user.id;
    await deleteCocktail(cocktailId, userId);
    res.json({ message: "Cocktail deleted" });
  } catch (e) {
    res.status(500).json({ message: "Failed to delete cocktail" });
  }
};