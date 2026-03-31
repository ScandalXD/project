import { db } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { ServiceError } from "./cocktail.service";
import { createNotification } from "./notificationEvent.service";

const validateCommentExists = async (commentId: number) => {
  if (!Number.isInteger(commentId)) {
    throw new ServiceError("Invalid comment id", 400);
  }

  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT id FROM cocktail_comments WHERE id = ?",
    [commentId],
  );

  if (rows.length === 0) {
    throw new ServiceError("Comment not found", 404);
  }
};

export const addCommentLike = async (
  userId: number,
  commentId: number,
): Promise<void> => {
  await validateCommentExists(commentId);

  const [existing] = await db.query<RowDataPacket[]>(
    `SELECT user_id
     FROM comment_likes
     WHERE user_id = ? AND comment_id = ?`,
    [userId, commentId],
  );

  if (existing.length > 0) {
    throw new ServiceError("Comment already liked", 409);
  }

  await db.query<ResultSetHeader>(
    `INSERT INTO comment_likes (user_id, comment_id)
     VALUES (?, ?)`,
    [userId, commentId],
  );

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT user_id, cocktail_id, cocktail_type
     FROM cocktail_comments
     WHERE id = ?`,
    [commentId],
  );

  if (rows.length > 0) {
    const comment = rows[0] as {
      user_id: number;
      cocktail_id: string;
      cocktail_type: "catalog" | "public";
    };

    await createNotification({
      userId: Number(comment.user_id),
      type: "comment_like",
      actorUserId: userId,
      recipeId: String(comment.cocktail_id),
      recipeType: comment.cocktail_type,
      commentId,
    });
  }
};

export const removeCommentLike = async (
  userId: number,
  commentId: number,
): Promise<void> => {
  if (!Number.isInteger(commentId)) {
    throw new ServiceError("Invalid comment id", 400);
  }

  const [result] = await db.query<ResultSetHeader>(
    `DELETE FROM comment_likes
     WHERE user_id = ? AND comment_id = ?`,
    [userId, commentId],
  );

  if (result.affectedRows === 0) {
    throw new ServiceError("Comment like not found", 404);
  }
};

export const getCommentLikesCount = async (
  commentId: number,
): Promise<number> => {
  await validateCommentExists(commentId);

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS count
     FROM comment_likes
     WHERE comment_id = ?`,
    [commentId],
  );

  return Number(rows[0].count);
};

export const isCommentLikedByUser = async (
  userId: number,
  commentId: number,
): Promise<boolean> => {
  if (!Number.isInteger(commentId)) {
    throw new ServiceError("Invalid comment id", 400);
  }

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT user_id
     FROM comment_likes
     WHERE user_id = ? AND comment_id = ?`,
    [userId, commentId],
  );

  return rows.length > 0;
};
