import { Request, Response } from "express";
import {
  addFavorite,
  removeFavorite,
  getFavorites,
} from "../services/favorite.service";

interface AddFavoriteBody {
  cocktailId: number | string;
  cocktail_type: "catalog" | "public";
}

interface FavoriteParams {
  cocktailId: string;
  cocktail_type: "catalog" | "public";
}

export const addToFavorites = async (
  req: Request<{}, {}, AddFavoriteBody>,
  res: Response
) => {
  const { cocktailId, cocktail_type } = req.body;

  if (!cocktailId || !cocktail_type) {
    return res.status(400).json({ message: "Invalid data" });
  }

  await addFavorite(req.user!.id, cocktailId, cocktail_type);
  res.status(201).json({ message: "Added to favorites" });
};

export const removeFromFavorites = async (
  req: Request<FavoriteParams>,
  res: Response
) => {
  await removeFavorite(
    req.user!.id,
    req.params.cocktailId,
    req.params.cocktail_type
  );

  res.json({ message: "Removed from favorites" });
};

export const getUserFavorites = async (req: Request, res: Response) => {
  const favorites = await getFavorites(req.user!.id);
  res.json(favorites);
};
