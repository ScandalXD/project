import { Request, Response } from "express";
import {
  getPendingCocktails,
  approveCocktail,
  rejectCocktail,
  cancelModeration,
  removePublishedCocktail,
  getPublishedCocktailsForAdmin,
} from "../services/adminModeration.service";
import { ServiceError } from "../services/cocktail.service";

const handleError = (res: Response, err: unknown) => {
  if (err instanceof ServiceError) {
    return res.status(err.status).json({ message: err.message });
  }

  if (err instanceof Error) {
    return res.status(400).json({ message: err.message });
  }

  return res.status(500).json({ message: "Internal server error" });
};

interface ReasonBody {
  reason: string;
}

export const getPendingCocktailsHandler = async (_: Request, res: Response) => {
  try {
    const cocktails = await getPendingCocktails();
    res.json(cocktails);
  } catch (e) {
    handleError(res, e);
  }
};

export const getPublishedCocktailsHandler = async (_: Request, res: Response) => {
  try {
    const cocktails = await getPublishedCocktailsForAdmin();
    res.json(cocktails);
  } catch (e) {
    handleError(res, e);
  }
};

export const approveCocktailHandler = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await approveCocktail(req.user.id, Number(req.params.id));
    res.json({ message: "Cocktail approved and published" });
  } catch (e) {
    handleError(res, e);
  }
};

export const rejectCocktailHandler = async (
  req: Request<{ id: string }, {}, ReasonBody>,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await rejectCocktail(req.user.id, Number(req.params.id), req.body.reason);
    res.json({ message: "Cocktail rejected" });
  } catch (e) {
    handleError(res, e);
  }
};

export const cancelModerationHandler = async (
  req: Request<{ id: string }, {}, ReasonBody>,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await cancelModeration(
      req.user.id,
      Number(req.params.id),
      req.body.reason
    );
    res.json({ message: "Moderation cancelled and returned for editing" });
  } catch (e) {
    handleError(res, e);
  }
};

export const removePublishedCocktailHandler = async (
  req: Request<{ id: string }, {}, ReasonBody>,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await removePublishedCocktail(
      req.user.id,
      Number(req.params.id),
      req.body.reason
    );
    res.json({ message: "Published cocktail removed" });
  } catch (e) {
    handleError(res, e);
  }
};