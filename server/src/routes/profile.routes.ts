import { Router } from "express";
import {
  getProfile,
  updateProfile,
  updateAvatar,
  deleteProfile,
  changePassword,
} from "../controllers/profile.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { uploadAvatar } from "../middleware/uploadAvatar.middleware";

const router = Router();

router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.put("/profile/avatar", authMiddleware, uploadAvatar.single("avatar"), updateAvatar);
router.put("/profile/password", authMiddleware, changePassword);
router.delete("/profile", authMiddleware, deleteProfile);

export default router;
