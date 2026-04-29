import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  requireAdmin,
  requireSuperadmin,
} from "../middleware/admin.middleware";
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
  getSystemStatsHandler,
} from "../controllers/adminDashboard.controller";
import {
  deactivateUserHandler,
  reactivateUserHandler,
  updateUserRoleHandler,
} from "../controllers/adminUser.controller";
import { uploadCatalogImage } from "../middleware/uploadCatalog.middleware";
import { getAllCommentsForAdminHandler } from "../controllers/comment.controller";

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
router.get("/comments", getAllCommentsForAdminHandler);

router.patch("/users/:id/deactivate", deactivateUserHandler);
router.patch("/users/:id/reactivate", reactivateUserHandler);
router.patch("/users/:id/role", requireSuperadmin, updateUserRoleHandler);

router.post(
  "/catalog",
  uploadCatalogImage.single("image"),
  addCatalogCocktailHandler,
);

router.put(
  "/catalog/:id",
  uploadCatalogImage.single("image"),
  updateCatalogCocktailHandler,
);
router.delete("/catalog/:id", deleteCatalogCocktailHandler);

export default router;