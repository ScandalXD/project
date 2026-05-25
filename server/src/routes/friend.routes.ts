import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  acceptFriendRequestHandler,
  blockUserHandler,
  getBlockedUsersHandler,
  getFriendRequestsHandler,
  getFriendsHandler,
  rejectFriendRequestHandler,
  removeFriendHandler,
  searchUsersHandler,
  sendFriendRequestHandler,
  unblockUserHandler,
} from "../controllers/friend.controller";

const router = Router();

router.use(authMiddleware);

router.get("/friends/search", searchUsersHandler);
router.get("/friends", getFriendsHandler);
router.get("/friends/requests", getFriendRequestsHandler);
router.get("/friends/blocked", getBlockedUsersHandler);

router.post("/friends/requests", sendFriendRequestHandler);
router.patch("/friends/requests/:id/accept", acceptFriendRequestHandler);
router.patch("/friends/requests/:id/reject", rejectFriendRequestHandler);

router.delete("/friends/:id", removeFriendHandler);

router.post("/friends/block", blockUserHandler);
router.delete("/friends/blocked/:id", unblockUserHandler);

export default router;
