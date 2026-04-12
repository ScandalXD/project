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
  deleteAnyCommentHandler,
} from "../controllers/adminModeration.controller";
import {
  addCatalogCocktailHandler,
  updateCatalogCocktailHandler,
  deleteCatalogCocktailHandler,
} from "../controllers/adminCatalog.controller";
import {
  getAllUsersHandler,
  getSystemStatsHandler
} from "../controllers/adminDashboard.controller";
import { deactivateUserHandler, reactivateUserHandler } from "../controllers/adminUser.controller";
import { reactivateUser } from "../services/adminUser.service";

const router = Router();

router.use(authMiddleware, requireAdmin);

router.get("/stats", getSystemStatsHandler);
router.get("/users", getAllUsersHandler);

router.get("/moderation/pending", getPendingCocktailsHandler);
router.get("/moderation/published", getPublishedCocktailsHandler);

router.post("/moderation/:id/approve", approveCocktailHandler);
router.post("/moderation/:id/reject", rejectCocktailHandler);
router.post("/moderation/:id/cancel", cancelModerationHandler);
router.post("/moderation/:id/remove", removePublishedCocktailHandler);

router.delete("/comments/:id", deleteAnyCommentHandler);

router.patch("/users/:id/deactivate", deactivateUserHandler);
router.patch("/users/:id/reactivate", reactivateUserHandler);

router.post("/catalog", addCatalogCocktailHandler);
router.put("/catalog/:id", updateCatalogCocktailHandler);
router.delete("/catalog/:id", deleteCatalogCocktailHandler);

export default router;