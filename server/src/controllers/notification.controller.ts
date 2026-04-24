import { Request, Response } from "express";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
} from "../services/notification.service";
import { ServiceError } from "../services/cocktail.service";

const handleError = (res: Response, err: unknown) => {
  if (err instanceof ServiceError) {
    return res.status(err.status).json({ message: err.message });
  }

  if (err instanceof Error) {
    return res.status(400).json({ message: err.message });
  }

  return res.status(500).json({ message: "Internal server error" });
};

export const getNotificationsHandler = async (
  req: Request,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const notifications = await getUserNotifications(req.user.id);
    res.json(notifications);
  } catch (e) {
    handleError(res, e);
  }
};

export const markNotificationAsReadHandler = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await markNotificationAsRead(req.user.id, Number(req.params.id));
    res.json({ message: "Notification marked as read" });
  } catch (e) {
    handleError(res, e);
  }
};

export const markAllNotificationsAsReadHandler = async (
  req: Request,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await markAllNotificationsAsRead(req.user.id);
    res.json({ message: "All notifications marked as read" });
  } catch (e) {
    handleError(res, e);
  }
};

export const clearAllNotificationsHandler = async (
  req: Request,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await clearAllNotifications(req.user.id);
    res.json({ message: "Notifications cleared" });
  } catch (e) {
    handleError(res, e);
  }
};