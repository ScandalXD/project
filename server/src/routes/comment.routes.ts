import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  addCommentHandler,
  getCommentsHandler,
  deleteCommentHandler,
} from "../controllers/comment.controller";

const router = Router();

router.get("/comments/:cocktailType/:cocktailId", getCommentsHandler);
router.post("/comments", authMiddleware, addCommentHandler);
router.delete("/comments/:id", authMiddleware, deleteCommentHandler);

export default router;