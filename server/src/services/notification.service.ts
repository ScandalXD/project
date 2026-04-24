import { db } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { Notification } from "../models/Notification.model";
import { ServiceError } from "./cocktail.service";

export const getUserNotifications = async (
  userId: number
): Promise<Notification[]> => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT
        n.*,
        u.nickname AS actor_nickname,
        cc.content AS comment_content
     FROM notifications n
     JOIN users u ON n.actor_user_id = u.id
     LEFT JOIN cocktail_comments cc ON n.comment_id = cc.id
     WHERE n.user_id = ?
     ORDER BY n.created_at DESC, n.id DESC
     LIMIT 20`,
    [userId]
  );

  return rows as Notification[];
};

export const markNotificationAsRead = async (
  userId: number,
  notificationId: number
): Promise<void> => {
  if (!Number.isInteger(notificationId)) {
    throw new ServiceError("Invalid notification id", 400);
  }

  const [result] = await db.query<ResultSetHeader>(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE id = ? AND user_id = ?`,
    [notificationId, userId]
  );

  if (result.affectedRows === 0) {
    throw new ServiceError("Notification not found", 404);
  }
};

export const markAllNotificationsAsRead = async (
  userId: number
): Promise<void> => {
  await db.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE user_id = ? AND is_read = FALSE`,
    [userId]
  );
};

export const clearAllNotifications = async (
  userId: number
): Promise<void> => {
  await db.query("DELETE FROM notifications WHERE user_id = ?", [userId]);
};