import { db } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { CocktailComment, CocktailType } from "../models/Comment.model";
import { ServiceError } from "./cocktail.service";
import { processCommentMentions } from "./mention.service";
import { createNotification } from "./notificationEvent.service";

interface CommentRow extends CocktailComment {
  likes_count: number;
}

const validateCocktailType = (cocktailType: CocktailType) => {
  if (cocktailType !== "catalog" && cocktailType !== "public") {
    throw new ServiceError("Invalid cocktail type", 400);
  }
};

const validateCocktailExists = async (
  cocktailId: string,
  cocktailType: CocktailType
) => {
  validateCocktailType(cocktailType);

  if (!cocktailId) {
    throw new ServiceError("Cocktail id is required", 400);
  }

  const tableName =
    cocktailType === "catalog" ? "catalog_cocktails" : "public_cocktails";

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id FROM ${tableName} WHERE id = ?`,
    [cocktailId]
  );

  if (rows.length === 0) {
    throw new ServiceError("Cocktail not found", 404);
  }
};

const validateParentComment = async (
  parentCommentId: number,
  cocktailId: string,
  cocktailType: CocktailType
) => {
  if (!Number.isInteger(parentCommentId)) {
    throw new ServiceError("Invalid parent comment id", 400);
  }

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, cocktail_id, cocktail_type
     FROM cocktail_comments
     WHERE id = ?`,
    [parentCommentId]
  );

  if (rows.length === 0) {
    throw new ServiceError("Parent comment not found", 404);
  }

  const parent = rows[0] as {
    id: number;
    cocktail_id: string;
    cocktail_type: CocktailType;
  };

  if (
    String(parent.cocktail_id) !== String(cocktailId) ||
    parent.cocktail_type !== cocktailType
  ) {
    throw new ServiceError(
      "Parent comment belongs to another cocktail",
      409
    );
  }
};

export const addComment = async (
  userId: number,
  cocktailId: string,
  cocktailType: CocktailType,
  content: string,
  parentCommentId?: number | null
): Promise<number> => {
  await validateCocktailExists(cocktailId, cocktailType);

  if (!content || !content.trim()) {
    throw new ServiceError("Comment content is required", 400);
  }

  let parentCommentAuthorId: number | null = null;

  if (parentCommentId !== undefined && parentCommentId !== null) {
    await validateParentComment(parentCommentId, cocktailId, cocktailType);

    const [parentRows] = await db.query<RowDataPacket[]>(
      `SELECT user_id FROM cocktail_comments WHERE id = ?`,
      [parentCommentId]
    );

    if (parentRows.length > 0) {
      parentCommentAuthorId = Number(parentRows[0].user_id);
    }
  }

  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO cocktail_comments
      (user_id, cocktail_id, cocktail_type, content, parent_comment_id)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, cocktailId, cocktailType, content.trim(), parentCommentId ?? null]
  );

  const commentId = result.insertId;

  if (cocktailType === "public") {
    const [publicRows] = await db.query<RowDataPacket[]>(
      `SELECT author_id FROM public_cocktails WHERE id = ?`,
      [cocktailId]
    );

    if (publicRows.length > 0) {
      const authorId = Number(publicRows[0].author_id);

      await createNotification({
        userId: authorId,
        type: "cocktail_comment",
        actorUserId: userId,
        recipeId: cocktailId,
        recipeType: cocktailType,
        commentId,
      });
    }
  }

  if (parentCommentAuthorId !== null) {
    await createNotification({
      userId: parentCommentAuthorId,
      type: "comment_reply",
      actorUserId: userId,
      recipeId: cocktailId,
      recipeType: cocktailType,
      commentId,
    });
  }

  await processCommentMentions(
    userId,
    commentId,
    cocktailId,
    cocktailType,
    content.trim()
  );

  return commentId;
};

const buildCommentTree = (
  comments: CocktailComment[],
  parentId: number | null = null
): CocktailComment[] => {
  return comments
    .filter((comment) => comment.parent_comment_id === parentId)
    .map((comment) => ({
      ...comment,
      replies: buildCommentTree(comments, comment.id),
    }));
};

export const getComments = async (
  cocktailId: string,
  cocktailType: CocktailType,
  currentUserId?: number
): Promise<CocktailComment[]> => {
  await validateCocktailExists(cocktailId, cocktailType);

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT
        cc.*,
        u.nickname AS author_nickname,
        COUNT(cl.comment_id) AS likes_count
     FROM cocktail_comments cc
     JOIN users u ON cc.user_id = u.id
     LEFT JOIN comment_likes cl ON cc.id = cl.comment_id
     WHERE cc.cocktail_id = ? AND cc.cocktail_type = ?
     GROUP BY
       cc.id,
       cc.user_id,
       cc.cocktail_id,
       cc.cocktail_type,
       cc.content,
       cc.parent_comment_id,
       cc.created_at,
       u.nickname
     ORDER BY cc.created_at ASC`,
    [cocktailId, cocktailType]
  );

  const comments = rows as CommentRow[];

  let likedCommentIds = new Set<number>();

  if (currentUserId) {
    const [likedRows] = await db.query<RowDataPacket[]>(
      `SELECT comment_id
       FROM comment_likes
       WHERE user_id = ?`,
      [currentUserId]
    );

    likedCommentIds = new Set(
      likedRows.map((row) => Number(row.comment_id))
    );
  }

  const normalizedComments: CocktailComment[] = comments.map((comment) => ({
    id: Number(comment.id),
    user_id: Number(comment.user_id),
    cocktail_id: String(comment.cocktail_id),
    cocktail_type: comment.cocktail_type,
    content: comment.content,
    parent_comment_id:
      comment.parent_comment_id === null
        ? null
        : Number(comment.parent_comment_id),
    created_at: comment.created_at,
    author_nickname: comment.author_nickname,
    likes_count: Number(comment.likes_count),
    is_liked_by_user: currentUserId
      ? likedCommentIds.has(Number(comment.id))
      : false,
    replies: [],
  }));

  return buildCommentTree(normalizedComments);
};

export const deleteComment = async (
  userId: number,
  commentId: number
): Promise<void> => {
  if (!Number.isInteger(commentId)) {
    throw new ServiceError("Invalid comment id", 400);
  }

  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM cocktail_comments WHERE id = ?",
    [commentId]
  );

  if (rows.length === 0) {
    throw new ServiceError("Comment not found", 404);
  }

  const comment = rows[0] as CocktailComment;

  if (Number(comment.user_id) !== Number(userId)) {
    throw new ServiceError("Forbidden", 403);
  }

  await db.query("DELETE FROM cocktail_comments WHERE id = ?", [commentId]);
};