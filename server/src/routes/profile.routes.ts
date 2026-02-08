import { Router } from "express";
import { getProfile } from "../controllers/profile.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/profile", authMiddleware, getProfile);

export default router;
