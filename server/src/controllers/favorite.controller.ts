import { Request, Response } from "express";
import { addFavorite, removeFavorite, getFavorites } from "../services/favorite.service";

export const addToFavorites = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { cocktailId, cocktail_type } = req.body;

  if (!cocktailId || !cocktail_type) {
    return res.status(400).json({ message: "Invalid data" });
  }

  await addFavorite(req.user.id, cocktailId, cocktail_type);
  res.status(201).json({ message: "Added to favorites" });
};

export const removeFromFavorites = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const cocktailIdParam = req.params.cocktailId;
  const cocktailTypeParam = req.params.cocktail_type;

  if (
    !cocktailIdParam ||
    Array.isArray(cocktailIdParam) ||
    !cocktailTypeParam ||
    Array.isArray(cocktailTypeParam) ||
    (cocktailTypeParam !== "catalog" && cocktailTypeParam !== "public")
  ) {
    return res.status(400).json({ message: "Invalid params" });
  }

  try {
    await removeFavorite(
      req.user.id,
      cocktailIdParam,
      cocktailTypeParam
    );

    res.json({ message: "Removed from favorites" });
  } catch {
    res.status(500).json({ message: "Failed to remove favorite" });
  }
};

export const getUserFavorites = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const favorites = await getFavorites(req.user.id);
    res.json(favorites);
  } catch {
    res.status(500).json({ message: "Failed to get favorites" });
  }
};