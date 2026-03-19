import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  addLikeHandler,
  removeLikeHandler,
  getLikesCountHandler,
  isLikedByUserHandler,
} from "../controllers/like.controller";

const router = Router();

router.get("/likes/:cocktailType/:cocktailId", getLikesCountHandler);
router.get("/likes/:cocktailType/:cocktailId/me", authMiddleware, isLikedByUserHandler);
router.post("/likes", authMiddleware, addLikeHandler);
router.delete("/likes/:cocktailType/:cocktailId", authMiddleware, removeLikeHandler);

export default router;