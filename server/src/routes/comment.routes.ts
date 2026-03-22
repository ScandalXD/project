import { Router } from "express";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth.middleware";
import {
  addCommentHandler,
  getCommentsHandler,
  deleteCommentHandler,
} from "../controllers/comment.controller";
import {
  addCommentLikeHandler,
  removeCommentLikeHandler,
  getCommentLikesCountHandler,
  isCommentLikedByUserHandler,
} from "../controllers/commentLike.controller";

const router = Router();

router.get(
  "/comments/:cocktailType/:cocktailId",
   optionalAuthMiddleware,
   getCommentsHandler
  );
router.post("/comments", authMiddleware, addCommentHandler);
router.delete("/comments/:id", authMiddleware, deleteCommentHandler);

router.get("/comment-likes/:commentId", getCommentLikesCountHandler);
router.get(
  "/comment-likes/:commentId/me",
  authMiddleware,
  isCommentLikedByUserHandler
);
router.post("/comment-likes", authMiddleware, addCommentLikeHandler);
router.delete(
  "/comment-likes/:commentId",
  authMiddleware,
  removeCommentLikeHandler
);

export default router;