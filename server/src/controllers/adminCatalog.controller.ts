import { Request, Response } from "express";
import {
  addCatalogCocktail,
  updateCatalogCocktail,
  deleteCatalogCocktail,
} from "../services/adminCatalog.service";
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

interface CreateCatalogBody {
  id: string;
  name: string;
  category: "Alkoholowy" | "Bezalkoholowy";
  ingredients: string;
  instructions: string;
  image: string | null;
}

interface UpdateCatalogBody {
  name: string;
  category: "Alkoholowy" | "Bezalkoholowy";
  ingredients: string;
  instructions: string;
  image: string | null;
}

export const addCatalogCocktailHandler = async (
  req: Request<{}, {}, CreateCatalogBody>,
  res: Response
) => {
  try {
    await addCatalogCocktail(req.body);
    res.status(201).json({ message: "Catalog cocktail created" });
  } catch (e) {
    handleError(res, e);
  }
};

export const updateCatalogCocktailHandler = async (
  req: Request<{ id: string }, {}, UpdateCatalogBody>,
  res: Response
) => {
  try {
    await updateCatalogCocktail(req.params.id, req.body);
    res.json({ message: "Catalog cocktail updated" });
  } catch (e) {
    handleError(res, e);
  }
};

export const deleteCatalogCocktailHandler = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    await deleteCatalogCocktail(req.params.id);
    res.json({ message: "Catalog cocktail deleted" });
  } catch (e) {
    handleError(res, e);
  }
};