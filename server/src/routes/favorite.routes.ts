import { Router } from "express";
import {
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
} from "../controllers/favorite.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/favorites", addToFavorites);
router.get("/favorites", getUserFavorites);
router.delete("/favorites/:cocktailId/:cocktail_type", removeFromFavorites);

export default router;