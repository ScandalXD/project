import { Router } from "express";
import {
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
} from "../controllers/favorite.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", addToFavorites);
router.get("/", getUserFavorites);
router.delete("/:cocktailId/:cocktail_type", removeFromFavorites);

export default router;
