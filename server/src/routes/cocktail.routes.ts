import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  getCatalog,
  getPublic,
  getMyCocktails,
  createCocktail,
  editCocktail,
  publishUserCocktailHandler,
  removeCocktail,
  removePublicCocktail,
} from "../controllers/cocktail.controller";
import { uploadUserCocktailImage } from "../middleware/uploadUserCocktail.middleware";

const router = Router();

router.get("/catalog", getCatalog);
router.get("/public", getPublic);

router.get("/my", authMiddleware, getMyCocktails);
router.post(
  "/",
  authMiddleware,
  uploadUserCocktailImage.single("image"),
  createCocktail
);

router.put(
  "/:id",
  authMiddleware,
  uploadUserCocktailImage.single("image"),
  editCocktail
);
router.delete("/:id", authMiddleware, removeCocktail);
router.post("/:id/publish", authMiddleware, publishUserCocktailHandler);
router.delete("/public/:id", authMiddleware, removePublicCocktail);

export default router;