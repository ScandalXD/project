import { db } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { CocktailType } from "../models/Comment.model";
import { createNotification } from "./notificationEvent.service";

const extractMentionNicknames = (content: string): string[] => {
  const matches = content.match(/@([a-zA-Z0-9_]+)/g) ?? [];
  const nicknames = matches.map((match) => match.slice(1).toLowerCase());

  return [...new Set(nicknames)];
};

export const processCommentMentions = async (
  actorUserId: number,
  commentId: number,
  recipeId: string,
  recipeType: CocktailType,
  content: string
): Promise<void> => {
  const nicknames = extractMentionNicknames(content);

  if (nicknames.length === 0) {
    return;
  }

  const placeholders = nicknames.map(() => "?").join(", ");

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, nickname
     FROM users
     WHERE LOWER(nickname) IN (${placeholders})`,
    nicknames
  );

  const mentionedUsers = rows as Array<{ id: number; nickname: string }>;

  for (const user of mentionedUsers) {
    if (Number(user.id) === Number(actorUserId)) {
      continue;
    }

    await db.query<ResultSetHeader>(
      `INSERT IGNORE INTO comment_mentions
        (comment_id, mentioned_user_id, mentioned_by_user_id)
       VALUES (?, ?, ?)`,
      [commentId, user.id, actorUserId]
    );

    await createNotification({
      userId: user.id,
      type: "mention",
      actorUserId,
      recipeId,
      recipeType,
      commentId,
    });
  }
};