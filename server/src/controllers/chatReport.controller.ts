import { Request, Response } from "express";
import { ServiceError } from "../services/cocktail.service";
import {
  createChatReport,
  dismissChatReport,
  deleteReportedMessage,
  getAdminChatReports,
  warnChatUser,
  muteChatUser,
  banChatUser,
  deleteReviewedChatReport,
} from "../services/chatReport.service";
import {
  ChatReportReason,
  ChatReportStatus,
  ChatReportTargetType,
} from "../models/ChatReport.model";

const handleError = (res: Response, err: unknown) => {
  if (err instanceof ServiceError) {
    return res.status(err.status).json({ message: err.message });
  }

  if (err instanceof Error) {
    return res.status(400).json({ message: err.message });
  }

  return res.status(500).json({ message: "Internal server error" });
};

export const createChatReportHandler = async (
  req: Request<
    {},
    {},
    {
      targetType: ChatReportTargetType;
      messageId?: number | null;
      targetUserId?: number | null;
      reason: ChatReportReason;
      details?: string | null;
    }
  >,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const reportId = await createChatReport(
      req.user.id,
      req.body.targetType,
      req.body.reason,
      req.body.details,
      req.body.messageId === undefined ? null : Number(req.body.messageId),
      req.body.targetUserId === undefined ? null : Number(req.body.targetUserId),
    );

    res.status(201).json({
      message: "Chat report created",
      reportId,
    });
  } catch (e) {
    handleError(res, e);
  }
};

export const getAdminChatReportsHandler = async (
  req: Request<{}, {}, {}, { status?: ChatReportStatus }>,
  res: Response,
) => {
  try {
    const reports = await getAdminChatReports(req.query.status);
    res.json(reports);
  } catch (e) {
    handleError(res, e);
  }
};

export const dismissChatReportHandler = async (
  req: Request<{ id: string }, {}, { adminReason: string }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await dismissChatReport(
      req.user.id,
      Number(req.params.id),
      req.body.adminReason,
    );
    res.json({ message: "Chat report dismissed" });
  } catch (e) {
    handleError(res, e);
  }
};

export const deleteReportedMessageHandler = async (
  req: Request<{ id: string }, {}, { adminReason: string }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await deleteReportedMessage(
      req.user.id,
      Number(req.params.id),
      req.body.adminReason,
    );
    res.json({ message: "Reported message deleted" });
  } catch (e) {
    handleError(res, e);
  }
};

export const warnChatUserHandler = async (
  req: Request<{ id: string }, {}, { adminReason: string }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await warnChatUser(req.user.id, Number(req.params.id), req.body.adminReason);
    res.json({ message: "User warned" });
  } catch (e) {
    handleError(res, e);
  }
};

export const muteChatUserHandler = async (
  req: Request<{ id: string }, {}, { adminReason: string; mutedUntil: string }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await muteChatUser(
      req.user.id,
      Number(req.params.id),
      req.body.adminReason,
      req.body.mutedUntil,
    );
    res.json({ message: "User muted" });
  } catch (e) {
    handleError(res, e);
  }
};

export const banChatUserHandler = async (
  req: Request<
    { id: string },
    {},
    { adminReason: string; isPermanent: boolean; bannedUntil?: string | null }
  >,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await banChatUser(
      req.user.id,
      Number(req.params.id),
      req.body.adminReason,
      Boolean(req.body.isPermanent),
      req.body.bannedUntil,
    );
    res.json({ message: "User banned from chat" });
  } catch (e) {
    handleError(res, e);
  }
};

export const deleteReviewedChatReportHandler = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    await deleteReviewedChatReport(Number(req.params.id));
    res.json({ message: "Chat report deleted" });
  } catch (e) {
    handleError(res, e);
  }
};
