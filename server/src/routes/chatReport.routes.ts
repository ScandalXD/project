import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { createChatReportHandler } from "../controllers/chatReport.controller";

const router = Router();

router.post("/chat-reports", authMiddleware, createChatReportHandler);

export default router;
