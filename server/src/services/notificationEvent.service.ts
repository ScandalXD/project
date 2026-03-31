import { db } from "../config/db";
import { ResultSetHeader } from "mysql2";
import { NotificationType, RecipeType } from "../models/Notification.model";

interface CreateNotificationInput {
  userId: number;
  type: NotificationType;
  actorUserId: number;
  recipeId: string;
  recipeType: RecipeType;
  commentId?: number | null;
}

export const createNotification = async ({
  userId,
  type,
  actorUserId,
  recipeId,
  recipeType,
  commentId = null,
}: CreateNotificationInput): Promise<void> => {
  if (Number(userId) === Number(actorUserId)) {
    return;
  }

  await db.query<ResultSetHeader>(
    `INSERT INTO notifications
      (user_id, type, actor_user_id, recipe_id, recipe_type, comment_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, type, actorUserId, recipeId, recipeType, commentId]
  );
};