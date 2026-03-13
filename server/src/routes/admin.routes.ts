import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";
import {
  getPendingCocktailsHandler,
  getPublishedCocktailsHandler,
  approveCocktailHandler,
  rejectCocktailHandler,
  cancelModerationHandler,
  removePublishedCocktailHandler,
} from "../controllers/adminModeration.controller";

const router = Router();

router.use(authMiddleware, requireAdmin);

router.get("/moderation/pending", getPendingCocktailsHandler);
router.get("/moderation/published", getPublishedCocktailsHandler);
router.post("/moderation/:id/approve", approveCocktailHandler);
router.post("/moderation/:id/reject", rejectCocktailHandler);
router.post("/moderation/:id/cancel", cancelModerationHandler);
router.post("/moderation/:id/remove", removePublishedCocktailHandler);

export default router;