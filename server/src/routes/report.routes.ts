import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";
import {
  createReportHandler,
  getReportsHandler,
  markReportReviewedHandler,
  hidePublicCocktailFromReportHandler,
  deleteCommentFromReportHandler,
} from "../controllers/report.controller";

const router = Router();

router.post("/reports", authMiddleware, createReportHandler);
router.get("/admin/reports", authMiddleware, requireAdmin, getReportsHandler);
router.patch(
  "/admin/reports/:id/review",
  authMiddleware,
  requireAdmin,
  markReportReviewedHandler
);
router.patch(
  "/admin/reports/:id/hide-public-cocktail",
  authMiddleware,
  requireAdmin,
  hidePublicCocktailFromReportHandler
);
router.patch(
    "/admin/reports/:id/delete-comment",
    authMiddleware,
    requireAdmin,
    deleteCommentFromReportHandler
)

export default router;