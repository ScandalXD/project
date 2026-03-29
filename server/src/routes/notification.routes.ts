import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  getNotificationsHandler,
  markNotificationAsReadHandler,
  markAllNotificationsAsReadHandler,
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

export default router;