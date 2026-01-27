import { Router } from "express";
import { getProfile } from "../controllers/profile.controller";
import { verifyJWT } from "../middleware/auth.middleware";

const router = Router();

router.get("/profile", verifyJWT, getProfile);

export default router;
