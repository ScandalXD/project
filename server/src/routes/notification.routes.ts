import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  getNotificationsHandler,
  markNotificationAsReadHandler,
  markAllNotificationsAsReadHandler,
  clearAllNotificationsHandler
} from "../controllers/notification.controller";

const router = Router();

router.get("/notifications", authMiddleware, getNotificationsHandler);
router.patch(
  "/notifications/:id/read",
  authMiddleware,
  markNotificationAsReadHandler
);
router.patch(
  "/notifications/read-all",
  authMiddleware,
  markAllNotificationsAsReadHandler
);
router.delete("/notifications/clear-all", authMiddleware, clearAllNotificationsHandler);

export default router;