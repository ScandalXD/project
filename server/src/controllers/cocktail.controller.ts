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
} from "../services/cocktail.service";

const handleError = (res: Response, err: unknown) => {
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
  res.json(await getCatalogCocktails());
};

export const getPublic = async (_: Request, res: Response) => {
  res.json(await getPublicCocktails());
};

export const getMyCocktails = async (req: Request, res: Response) => {
  res.json(await getUserCocktails(req.user.id));
};

export const createCocktail = async (
  req: Request<{}, {}, CreateCocktailBody>,
  res: Response
) => {
  try {
    await addCocktail({
      ...req.body,
      owner_id: req.user.id,
    });

    res.status(201).json({ message: "Created" });
  } catch (e) {
    handleError(res, e);
  }
};

export const editCocktail = async (
  req: Request<{ id: string }, {}, CreateCocktailBody>,
  res: Response
) => {
  try {
    await updateCocktail(
      Number(req.params.id),
      req.user.id,
      req.body
    );

    res.json({ message: "Updated" });
  } catch (e) {
    handleError(res, e);
  }
};

export const publishUserCocktailHandler = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    await publishUserCocktail(
      Number(req.params.id),
      req.user.id
    );

    res.json({ message: "Published" });
  } catch (e) {
    handleError(res, e);
  }
};

export const removeCocktail = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    await deleteCocktail(
      Number(req.params.id),
      req.user.id
    );

    res.json({ message: "Deleted" });
  } catch (e) {
    handleError(res, e);
  }
};

export const removePublicCocktail = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    await deletePublicCocktail(
      Number(req.params.id),
      req.user.id
    );

    res.json({ message: "Public cocktail deleted" });
  } catch (e) {
    handleError(res, e);
  }
};
