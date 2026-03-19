import { Request, Response } from "express";
import {
  addLike,
  removeLike,
  getLikesCount,
  isLikedByUser,
} from "../services/like.service";
import { ServiceError } from "../services/cocktail.service";
import { CocktailType } from "../models/Like.model";

const handleError = (res: Response, err: unknown) => {
  if (err instanceof ServiceError) {
    return res.status(err.status).json({ message: err.message });
  }

  if (err instanceof Error) {
    return res.status(400).json({ message: err.message });
  }

  return res.status(500).json({ message: "Internal server error" });
};

interface LikeBody {
  cocktailId: string;
  cocktailType: CocktailType;
}

export const addLikeHandler = async (
  req: Request<{}, {}, LikeBody>,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { cocktailId, cocktailType } = req.body;
    await addLike(req.user.id, cocktailId, cocktailType);
    res.status(201).json({ message: "Like added" });
  } catch (e) {
    handleError(res, e);
  }
};

export const removeLikeHandler = async (
  req: Request<{ cocktailId: string; cocktailType: string }>,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await removeLike(
      req.user.id,
      req.params.cocktailId,
      req.params.cocktailType as CocktailType
    );
    res.json({ message: "Like removed" });
  } catch (e) {
    handleError(res, e);
  }
};

export const getLikesCountHandler = async (
  req: Request<{ cocktailId: string; cocktailType: string }>,
  res: Response
) => {
  try {
    const count = await getLikesCount(
      req.params.cocktailId,
      req.params.cocktailType as CocktailType
    );
    res.json({ count });
  } catch (e) {
    handleError(res, e);
  }
};

export const isLikedByUserHandler = async (
  req: Request<{ cocktailId: string; cocktailType: string }>,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const liked = await isLikedByUser(
      req.user.id,
      req.params.cocktailId,
      req.params.cocktailType as CocktailType
    );
    res.json({ liked });
  } catch (e) {
    handleError(res, e);
  }
};