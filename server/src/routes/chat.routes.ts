import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { uploadChatAttachment } from "../middleware/uploadChat.middleware";
import {
  deleteConversationForEveryoneHandler,
  deleteConversationForUserHandler,
  deleteMessageForEveryoneHandler,
  deleteMessageForUserHandler,
  editTextMessageHandler,
  forwardMessageHandler,
  getConversationMessagesHandler,
  getConversationsHandler,
  markConversationAsReadHandler,
  markConversationAsUnreadHandler,
  openPrivateConversationHandler,
  pinMessageHandler,
  removeMessageReactionHandler,
  pinConversationHandler,
  sendAttachmentMessageHandler,
  sendCocktailShareMessageHandler,
  sendTextMessageHandler,
  setMessageReactionHandler,
  unpinMessageHandler,
  unpinConversationHandler,
} from "../controllers/chat.controller";

const router = Router();

router.use(authMiddleware);

router.get("/chat/conversations", getConversationsHandler);
router.post("/chat/conversations", openPrivateConversationHandler);

router.get("/chat/conversations/:id/messages", getConversationMessagesHandler);
router.post("/chat/conversations/:id/messages/text", sendTextMessageHandler);
router.post(
  "/chat/conversations/:id/messages/cocktail-share",
  sendCocktailShareMessageHandler,
);
router.post(
  "/chat/conversations/:id/messages/attachment",
  uploadChatAttachment.single("file"),
  sendAttachmentMessageHandler,
);
router.patch("/chat/conversations/:id/read", markConversationAsReadHandler);
router.patch("/chat/conversations/:id/unread", markConversationAsUnreadHandler);
router.patch("/chat/conversations/:id/pin", pinConversationHandler);
router.patch("/chat/conversations/:id/unpin", unpinConversationHandler);
router.delete("/chat/conversations/:id", deleteConversationForUserHandler);
router.delete(
  "/chat/conversations/:id/everyone",
  deleteConversationForEveryoneHandler,
);

router.delete("/chat/messages/:id", deleteMessageForUserHandler);
router.delete("/chat/messages/:id/everyone", deleteMessageForEveryoneHandler);
router.patch("/chat/messages/:id", editTextMessageHandler);
router.post("/chat/messages/:id/forward", forwardMessageHandler);
router.put("/chat/messages/:id/reaction", setMessageReactionHandler);
router.delete("/chat/messages/:id/reaction", removeMessageReactionHandler);
router.patch("/chat/messages/:id/pin", pinMessageHandler);
router.patch("/chat/messages/:id/unpin", unpinMessageHandler);

export default router;
