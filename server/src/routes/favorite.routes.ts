import { Router } from "express";
import {
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
} from "../controllers/favorite.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/favorites", authMiddleware, addToFavorites);
router.get("/favorites", authMiddleware, getUserFavorites);
router.delete(
  "/favorites/:cocktailId/:cocktail_type",
  authMiddleware,
  removeFromFavorites
);

export default router;