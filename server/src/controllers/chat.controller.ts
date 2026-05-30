import { Request, Response } from "express";
import { ServiceError } from "../services/cocktail.service";
import {
  deleteConversationForEveryone,
  deleteConversationForUser,
  deleteMessageForEveryone,
  deleteMessageForUser,
  getConversationMessages,
  getUserConversations,
  markConversationAsRead,
  markConversationAsUnread,
  openPrivateConversation,
  sendAttachmentMessage,
  sendCocktailShareMessage,
  sendTextMessage,
  setConversationPinned,
} from "../services/chat.service";
import { ChatCocktailType } from "../models/Chat.model";
import {
  emitConversationRemoved,
  emitMessageDeleted,
} from "../services/socket.service";

const handleError = (res: Response, err: unknown) => {
  if (err instanceof ServiceError) {
    return res.status(err.status).json({ message: err.message });
  }

  if (err instanceof Error) {
    return res.status(400).json({ message: err.message });
  }

  return res.status(500).json({ message: "Internal server error" });
};

export const getConversationsHandler = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const conversations = await getUserConversations(req.user.id);
    res.json(conversations);
  } catch (e) {
    handleError(res, e);
  }
};

export const openPrivateConversationHandler = async (
  req: Request<{}, {}, { friendId: number }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const conversationId = await openPrivateConversation(
      req.user.id,
      Number(req.body.friendId),
    );

    res.status(201).json({
      message: "Conversation ready",
      conversationId,
    });
  } catch (e) {
    handleError(res, e);
  }
};

export const getConversationMessagesHandler = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const messages = await getConversationMessages(
      req.user.id,
      Number(req.params.id),
    );

    res.json(messages);
  } catch (e) {
    handleError(res, e);
  }
};

export const sendTextMessageHandler = async (
  req: Request<
    { id: string },
    {},
    { content: string; replyToMessageId?: number | null }
  >,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const message = await sendTextMessage(
      req.user.id,
      Number(req.params.id),
      req.body.content,
      req.body.replyToMessageId,
    );

    res.status(201).json(message);
  } catch (e) {
    handleError(res, e);
  }
};

export const sendCocktailShareMessageHandler = async (
  req: Request<
    { id: string },
    {},
    {
      cocktailId: string;
      cocktailType: ChatCocktailType;
      replyToMessageId?: number | null;
    }
  >,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const message = await sendCocktailShareMessage(
      req.user.id,
      Number(req.params.id),
      String(req.body.cocktailId),
      req.body.cocktailType,
      req.body.replyToMessageId,
    );

    res.status(201).json(message);
  } catch (e) {
    handleError(res, e);
  }
};

export const sendAttachmentMessageHandler = async (
  req: Request<
    { id: string },
    {},
    {
      messageType: "image" | "file" | "voice";
      content?: string | null;
      replyToMessageId?: string | number | null;
      durationSeconds?: string | number | null;
    }
  >,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "Attachment file is required" });
  }

  const replyToMessageId =
    req.body.replyToMessageId === undefined ||
    req.body.replyToMessageId === null ||
    req.body.replyToMessageId === ""
      ? null
      : Number(req.body.replyToMessageId);

  const durationSeconds =
    req.body.durationSeconds === undefined ||
    req.body.durationSeconds === null ||
    req.body.durationSeconds === ""
      ? null
      : Number(req.body.durationSeconds);

  try {
    const message = await sendAttachmentMessage(
      req.user.id,
      Number(req.params.id),
      req.file,
      req.body.messageType,
      req.body.content,
      replyToMessageId,
      durationSeconds,
    );

    res.status(201).json(message);
  } catch (e) {
    handleError(res, e);
  }
};

export const markConversationAsReadHandler = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await markConversationAsRead(req.user.id, Number(req.params.id));
    res.json({ message: "Conversation marked as read" });
  } catch (e) {
    handleError(res, e);
  }
};

export const markConversationAsUnreadHandler = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await markConversationAsUnread(req.user.id, Number(req.params.id));
    res.json({ message: "Conversation marked as unread" });
  } catch (e) {
    handleError(res, e);
  }
};

export const pinConversationHandler = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await setConversationPinned(req.user.id, Number(req.params.id), true);
    res.json({ message: "Conversation pinned" });
  } catch (e) {
    handleError(res, e);
  }
};

export const unpinConversationHandler = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await setConversationPinned(req.user.id, Number(req.params.id), false);
    res.json({ message: "Conversation unpinned" });
  } catch (e) {
    handleError(res, e);
  }
};

export const deleteConversationForUserHandler = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await deleteConversationForUser(req.user.id, Number(req.params.id));
    res.json({ message: "Conversation deleted" });
  } catch (e) {
    handleError(res, e);
  }
};

export const deleteConversationForEveryoneHandler = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const result = await deleteConversationForEveryone(
      req.user.id,
      Number(req.params.id),
    );
    emitConversationRemoved(result.conversationId, result.participantIds);
    res.json({ message: "Conversation deleted for everyone" });
  } catch (e) {
    handleError(res, e);
  }
};

export const deleteMessageForUserHandler = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await deleteMessageForUser(req.user.id, Number(req.params.id));
    res.json({ message: "Message deleted" });
  } catch (e) {
    handleError(res, e);
  }
};

export const deleteMessageForEveryoneHandler = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const result = await deleteMessageForEveryone(
      req.user.id,
      Number(req.params.id),
    );
    emitMessageDeleted(result.conversationId, result.messageId);
    res.json({ message: "Message deleted for everyone" });
  } catch (e) {
    handleError(res, e);
  }
};
