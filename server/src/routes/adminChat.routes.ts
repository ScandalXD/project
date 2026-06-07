import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";
import {
  banChatUserHandler,
  deleteReviewedChatReportHandler,
  deleteReportedMessageHandler,
  dismissChatReportHandler,
  getAdminChatReportsHandler,
  muteChatUserHandler,
  warnChatUserHandler,
} from "../controllers/chatReport.controller";

const router = Router();

router.use(authMiddleware, requireAdmin);

router.get("/chat-reports", getAdminChatReportsHandler);
router.patch("/chat-reports/:id/dismiss", dismissChatReportHandler);
router.patch("/chat-reports/:id/delete-message", deleteReportedMessageHandler);
router.patch("/chat-reports/:id/warn", warnChatUserHandler);
router.patch("/chat-reports/:id/mute", muteChatUserHandler);
router.patch("/chat-reports/:id/ban", banChatUserHandler);
router.delete("/chat-reports/:id", deleteReviewedChatReportHandler);

export default router;
