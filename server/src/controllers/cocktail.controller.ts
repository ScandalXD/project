import { Request, Response } from "express";
import {
  getCatalogCocktails,
  getPublicCocktails,
  getUserCocktails,
  addCocktail,
  updateCocktail,
  publishUserCocktail,
  deleteCocktail,
  deletePublicCocktail,
  ServiceError,
} from "../services/cocktail.service";

const handleError = (res: Response, err: unknown) => {
  if (err instanceof ServiceError) {
    return res.status(err.status).json({ message: err.message });
  }

  if (err instanceof Error) {
    return res.status(400).json({ message: err.message });
  }

  return res.status(500).json({ message: "Internal server error" });
};

interface CreateCocktailBody {
  name: string;
  category: "Alkoholowy" | "Bezalkoholowy";
  ingredients: string;
  instructions: string;
  image: string | null;
}

export const getCatalog = async (_: Request, res: Response) => {
  try {
    const cocktails = await getCatalogCocktails();
    res.json(cocktails);
  } catch (e) {
    handleError(res, e);
  }
};

export const getPublic = async (_: Request, res: Response) => {
  try {
    const cocktails = await getPublicCocktails();
    res.json(cocktails);
  } catch (e) {
    handleError(res, e);
  }
};

export const getMyCocktails = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const cocktails = await getUserCocktails(req.user.id);
    res.json(cocktails);
  } catch (e) {
    handleError(res, e);
  }
};

export const createCocktail = async (
  req: Request<{}, {}, CreateCocktailBody>,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const cocktailId = await addCocktail({
      owner_id: req.user.id,
      ...req.body,
    });

    res.status(201).json({
      message: "Cocktail created",
      cocktailId,
    });
  } catch (e) {
    handleError(res, e);
  }
};

export const editCocktail = async (
  req: Request<{ id: string }, {}, CreateCocktailBody>,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await updateCocktail(Number(req.params.id), req.user.id, req.body);

    res.json({ message: "Cocktail updated" });
  } catch (e) {
    handleError(res, e);
  }
};

export const publishUserCocktailHandler = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await publishUserCocktail(Number(req.params.id), req.user.id);

    res.json({ message: "Submitted for moderation" });
  } catch (e) {
    handleError(res, e);
  }
};

export const removeCocktail = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await deleteCocktail(Number(req.params.id), req.user.id);

    res.json({ message: "Cocktail deleted" });
  } catch (e) {
    handleError(res, e);
  }
};

export const removePublicCocktail = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await deletePublicCocktail(Number(req.params.id), req.user.id);

    res.json({ message: "Publication removed" });
  } catch (e) {
    handleError(res, e);
  }
};