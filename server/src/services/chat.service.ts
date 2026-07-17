import { RowDataPacket, ResultSetHeader } from "mysql2";
import { db } from "../config/db";
import {
  ChatAttachmentMessageType,
  ChatCocktailType,
  ChatMessage,
  ChatMessageMetadata,
  ChatMessageType,
  ConversationListItem,
  MessageReactionSummary,
  SendMessageInput,
} from "../models/Chat.model";
import { ServiceError } from "./cocktail.service";
import { createNotification } from "./notificationEvent.service";
import { deleteUploadedFile } from "../utils/file.util";

const MESSAGE_MAX_LENGTH = 2000;
const MESSAGE_COOLDOWN_MS = 1200;

const parseMetadata = <T extends ChatMessage | ConversationListItem>(
  item: T,
): T => {
  const metadataKey = "metadata" in item ? "metadata" : "last_message_metadata";
  const rawMetadata = item[metadataKey as keyof T];

  if (typeof rawMetadata !== "string") {
    return item;
  }

  try {
    return {
      ...item,
      [metadataKey]: JSON.parse(rawMetadata),
    };
  } catch {
    return item;
  }
};

const enrichPublicCocktailShareAuthors = async (
  messages: ChatMessage[],
): Promise<ChatMessage[]> => {
  const publicCocktailIds = Array.from(
    new Set(
      messages
        .map((message) => {
          const metadata = message.metadata;

          if (
            message.message_type !== "cocktail_share" ||
            !metadata ||
            typeof metadata !== "object" ||
            !("cocktailType" in metadata) ||
            metadata.cocktailType !== "public" ||
            (metadata.authorId && metadata.authorAvatar)
          ) {
            return null;
          }

          return String(metadata.cocktailId);
        })
        .filter((id): id is string => Boolean(id)),
    ),
  );

  if (publicCocktailIds.length === 0) {
    return messages;
  }

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT pc.id, pc.author_id, u.nickname AS author_nickname, u.avatar AS author_avatar
     FROM public_cocktails pc
     JOIN users u ON pc.author_id = u.id
     WHERE pc.id IN (?)`,
    [publicCocktailIds],
  );

  const authorsByCocktailId = new Map(
    rows.map((row) => [
      String(row.id),
      {
        authorId: Number(row.author_id),
        authorNickname: String(row.author_nickname),
        authorAvatar: row.author_avatar ?? null,
      },
    ]),
  );

  return messages.map((message) => {
    const metadata = message.metadata;

    if (
      message.message_type !== "cocktail_share" ||
      !metadata ||
      typeof metadata !== "object" ||
      !("cocktailType" in metadata) ||
      metadata.cocktailType !== "public"
    ) {
      return message;
    }

    const author = authorsByCocktailId.get(String(metadata.cocktailId));

    if (!author) {
      return message;
    }

    return {
      ...message,
      metadata: {
        ...metadata,
        authorId: metadata.authorId ?? author.authorId,
        authorNickname: metadata.authorNickname ?? author.authorNickname,
        authorAvatar: metadata.authorAvatar ?? author.authorAvatar,
      },
    };
  });
};

const ensureInteger = (value: number, message: string) => {
  if (!Number.isInteger(value)) {
    throw new ServiceError(message, 400);
  }
};

const getRelationship = async (userId: number, otherUserId: number) => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT *
     FROM friendships
     WHERE (requester_id = ? AND receiver_id = ?)
        OR (requester_id = ? AND receiver_id = ?)
     LIMIT 1`,
    [userId, otherUserId, otherUserId, userId],
  );

  return rows[0] as
    | {
        id: number;
        requester_id: number;
        receiver_id: number;
        status: "pending" | "accepted" | "rejected" | "blocked";
        blocked_by: number | null;
      }
    | undefined;
};

const ensureCanChatWithUser = async (userId: number, otherUserId: number) => {
  ensureInteger(otherUserId, "Invalid user id");

  if (userId === otherUserId) {
    throw new ServiceError("You cannot chat with yourself", 400);
  }

  const relationship = await getRelationship(userId, otherUserId);

  if (!relationship) {
    throw new ServiceError("You can only message friends", 403);
  }

  if (relationship.status === "blocked") {
    throw new ServiceError("Chat is blocked for these users", 403);
  }

  if (relationship.status !== "accepted") {
    throw new ServiceError("You can only message accepted friends", 403);
  }
};

const ensureUserChatAllowed = async (userId: number) => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT muted_until, is_chat_banned, chat_banned_until
     FROM user_chat_status
     WHERE user_id = ?`,
    [userId],
  );

  if (rows.length === 0) {
    await db.query(
      "INSERT INTO user_chat_status (user_id, last_seen_at) VALUES (?, NOW())",
      [userId],
    );
    return;
  }

  const status = rows[0] as {
    muted_until: string | Date | null;
    chat_banned_until: string | Date | null;
    is_chat_banned: number | boolean;
  };

  if (status.is_chat_banned) {
    throw new ServiceError("You are banned from chat", 403);
  }

  if (
    status.chat_banned_until &&
    new Date(status.chat_banned_until).getTime() > Date.now()
  ) {
    throw new ServiceError("You are temporarily banned from chat", 403);
  }

  if (status.muted_until && new Date(status.muted_until).getTime() > Date.now()) {
    throw new ServiceError("You are temporarily muted", 403);
  }
};

const getConversationParticipantIds = async (
  conversationId: number,
): Promise<number[]> => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT user_id FROM conversation_participants WHERE conversation_id = ?",
    [conversationId],
  );

  return rows.map((row) => Number(row.user_id));
};

const getVisibleConversationParticipantIds = async (
  conversationId: number,
): Promise<number[]> => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT user_id
     FROM conversation_participants
     WHERE conversation_id = ? AND deleted_at IS NULL`,
    [conversationId],
  );

  return rows.map((row) => Number(row.user_id));
};

const ensureConversationAccess = async (
  userId: number,
  conversationId: number,
): Promise<number[]> => {
  ensureInteger(conversationId, "Invalid conversation id");

  const participantIds = await getConversationParticipantIds(conversationId);

  if (!participantIds.includes(userId)) {
    throw new ServiceError("Conversation not found", 404);
  }

  return participantIds;
};

const ensureVisibleConversationAccess = async (
  userId: number,
  conversationId: number,
): Promise<number[]> => {
  ensureInteger(conversationId, "Invalid conversation id");

  const participantIds = await getVisibleConversationParticipantIds(conversationId);

  if (!participantIds.includes(userId)) {
    throw new ServiceError("Conversation not found", 404);
  }

  return participantIds;
};

export const getConversationParticipantsForUser = async (
  userId: number,
  conversationId: number,
): Promise<number[]> => {
  return ensureVisibleConversationAccess(userId, conversationId);
};

const getOtherParticipantId = (
  userId: number,
  participantIds: number[],
): number => {
  const otherUserId = participantIds.find((participantId) => participantId !== userId);

  if (!otherUserId) {
    throw new ServiceError("Conversation participant not found", 404);
  }

  return otherUserId;
};

const getExistingPrivateConversationId = async (
  userId: number,
  friendId: number,
): Promise<number | null> => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT c.id
     FROM conversations c
     JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
     JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
     WHERE c.type = 'private'
       AND cp1.user_id = ?
       AND cp2.user_id = ?
     LIMIT 1`,
    [userId, friendId],
  );

  return rows.length > 0 ? Number(rows[0].id) : null;
};

const notifyRecipient = async (
  recipientId: number,
  senderId: number,
  messageType: ChatMessageType,
) => {
  await createNotification({
    userId: recipientId,
    type: messageType === "cocktail_share" ? "cocktail_shared" : "new_message",
    actorUserId: senderId,
  });
};

const validateMessageContent = (
  messageType: ChatMessageType,
  content?: string | null,
  metadata?: ChatMessageMetadata,
) => {
  const hasCommentShareMetadata =
    metadata !== null &&
    metadata !== undefined &&
    typeof metadata === "object" &&
    "sharedType" in metadata &&
    metadata.sharedType === "comment";

  if (messageType === "text" && !hasCommentShareMetadata) {
    if (!content || !content.trim()) {
      throw new ServiceError("Message content is required", 400);
    }
  }

  if (content && content.length > MESSAGE_MAX_LENGTH) {
    throw new ServiceError("Message is too long", 400);
  }
};

const ensureNoSpamCooldown = async (userId: number) => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT created_at
     FROM messages
     WHERE sender_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
    [userId],
  );

  if (rows.length === 0) {
    return;
  }

  const lastSentAt = new Date(rows[0].created_at).getTime();

  if (Date.now() - lastSentAt < MESSAGE_COOLDOWN_MS) {
    throw new ServiceError("Please wait before sending another message", 429);
  }
};

const validateReplyMessage = async (
  conversationId: number,
  replyToMessageId?: number | null,
) => {
  if (replyToMessageId === undefined || replyToMessageId === null) {
    return null;
  }

  ensureInteger(replyToMessageId, "Invalid reply message id");

  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT id FROM messages WHERE id = ? AND conversation_id = ? AND deleted_at IS NULL",
    [replyToMessageId, conversationId],
  );

  if (rows.length === 0) {
    throw new ServiceError("Reply message not found", 404);
  }

  return replyToMessageId;
};

const createMessage = async (
  senderId: number,
  conversationId: number,
  input: SendMessageInput,
): Promise<ChatMessage> => {
  const participantIds = await ensureVisibleConversationAccess(
    senderId,
    conversationId,
  );
  const recipientId = getOtherParticipantId(senderId, participantIds);

  await ensureCanChatWithUser(senderId, recipientId);
  await ensureUserChatAllowed(senderId);
  await ensureNoSpamCooldown(senderId);

  const replyToMessageId = await validateReplyMessage(
    conversationId,
    input.replyToMessageId,
  );

  validateMessageContent(input.messageType, input.content, input.metadata);

  const content = input.content?.trim() || null;
  const metadata = input.metadata ? JSON.stringify(input.metadata) : null;

  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO messages
      (conversation_id, sender_id, reply_to_message_id, message_type, content, metadata)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      conversationId,
      senderId,
      replyToMessageId,
      input.messageType,
      content,
      metadata,
    ],
  );

  await db.query("UPDATE conversations SET updated_at = NOW() WHERE id = ?", [
    conversationId,
  ]);

  await db.query(
    `UPDATE conversation_participants
     SET deleted_at = NULL,
         is_marked_unread = CASE WHEN user_id = ? THEN FALSE ELSE is_marked_unread END
     WHERE conversation_id = ?`,
    [senderId, conversationId],
  );

  await db.query(
    `INSERT INTO message_reads (message_id, user_id)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE read_at = NOW()`,
    [result.insertId, senderId],
  );

  await notifyRecipient(recipientId, senderId, input.messageType);

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT m.*, u.nickname AS sender_nickname, u.avatar AS sender_avatar
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.id = ?`,
    [result.insertId],
  );

  const [message] = await withMessageState(senderId, [
    parseMetadata(rows[0] as ChatMessage),
  ]);

  return message;
};

export const openPrivateConversation = async (
  userId: number,
  friendId: number,
): Promise<number> => {
  await ensureCanChatWithUser(userId, friendId);
  await ensureUserChatAllowed(userId);

  const existingConversationId = await getExistingPrivateConversationId(
    userId,
    friendId,
  );

  if (existingConversationId !== null) {
    await db.query(
      `UPDATE conversation_participants
       SET deleted_at = NULL
       WHERE conversation_id = ?`,
      [existingConversationId],
    );

    return existingConversationId;
  }

  await db.query("START TRANSACTION");

  try {
    const [conversationResult] = await db.query<ResultSetHeader>(
      "INSERT INTO conversations (type) VALUES ('private')",
    );

    const conversationId = Number(conversationResult.insertId);

    await db.query(
      `INSERT INTO conversation_participants (conversation_id, user_id)
       VALUES (?, ?), (?, ?)`,
      [conversationId, userId, conversationId, friendId],
    );

    await db.query(
      `INSERT IGNORE INTO user_chat_status (user_id, last_seen_at)
       VALUES (?, NOW()), (?, NOW())`,
      [userId, friendId],
    );

    await db.query("COMMIT");
    return conversationId;
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
};

export const getUserConversations = async (
  userId: number,
): Promise<ConversationListItem[]> => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT
       c.*,
       other_user.id AS other_user_id,
       other_user.nickname AS other_user_nickname,
       other_user.avatar AS other_user_avatar,
       COALESCE(ucs.is_online, FALSE) AS is_online,
       ucs.last_seen_at,
       friendship.status AS friendship_status,
       friendship.blocked_by AS friendship_blocked_by,
       lm.id AS last_message_id,
       lm.message_type AS last_message_type,
       lm.content AS last_message_content,
       lm.metadata AS last_message_metadata,
       lm.created_at AS last_message_created_at,
       me.is_pinned,
       me.is_marked_unread,
       COUNT(unread.id) +
         IF(me.is_marked_unread = TRUE AND COUNT(unread.id) = 0, 1, 0)
         AS unread_count
     FROM conversations c
     JOIN conversation_participants me
       ON me.conversation_id = c.id AND me.user_id = ?
       AND me.deleted_at IS NULL
     JOIN conversation_participants other
       ON other.conversation_id = c.id AND other.user_id != ?
     JOIN users other_user ON other_user.id = other.user_id
     LEFT JOIN friendships friendship
       ON (
         friendship.requester_id = me.user_id
         AND friendship.receiver_id = other.user_id
       )
       OR (
         friendship.requester_id = other.user_id
         AND friendship.receiver_id = me.user_id
       )
     LEFT JOIN user_chat_status ucs ON ucs.user_id = other_user.id
     LEFT JOIN messages lm
       ON lm.id = (
         SELECT m2.id
         FROM messages m2
         LEFT JOIN message_deletions md2
           ON md2.message_id = m2.id AND md2.user_id = ?
         WHERE m2.conversation_id = c.id
           AND m2.deleted_at IS NULL
           AND md2.message_id IS NULL
         ORDER BY m2.created_at DESC, m2.id DESC
         LIMIT 1
       )
     LEFT JOIN messages unread
       ON unread.conversation_id = c.id
      AND unread.sender_id != ?
      AND unread.deleted_at IS NULL
      AND (
        me.last_read_message_id IS NULL
        OR unread.id > me.last_read_message_id
      )
     GROUP BY
       c.id,
       other_user.id,
       other_user.nickname,
       other_user.avatar,
       ucs.is_online,
       ucs.last_seen_at,
       friendship.status,
       friendship.blocked_by,
       lm.id,
       lm.message_type,
       lm.content,
       lm.metadata,
       lm.created_at,
       me.is_pinned,
       me.is_marked_unread
     ORDER BY me.is_pinned DESC, COALESCE(lm.created_at, c.updated_at) DESC, c.id DESC`,
    [userId, userId, userId, userId],
  );

  return (rows as ConversationListItem[]).map(parseMetadata);
};

export const getConversationMessages = async (
  userId: number,
  conversationId: number,
): Promise<ChatMessage[]> => {
  await ensureVisibleConversationAccess(userId, conversationId);

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT
       m.*,
       u.nickname AS sender_nickname,
       u.avatar AS sender_avatar,
       reply.content AS reply_content,
       reply.message_type AS reply_message_type,
       EXISTS (
         SELECT 1
         FROM message_reads mr
         WHERE mr.message_id = m.id
           AND mr.user_id <> m.sender_id
       ) AS is_read_by_recipient
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     LEFT JOIN messages reply ON m.reply_to_message_id = reply.id
     LEFT JOIN message_deletions md
       ON md.message_id = m.id AND md.user_id = ?
     WHERE m.conversation_id = ?
       AND m.deleted_at IS NULL
       AND md.message_id IS NULL
     ORDER BY m.created_at ASC, m.id ASC`,
    [userId, conversationId],
  );

  const messages = await enrichPublicCocktailShareAuthors(
    (rows as ChatMessage[]).map(parseMetadata),
  );

  return withMessageState(userId, messages);
};

export const sendTextMessage = async (
  senderId: number,
  conversationId: number,
  content?: string | null,
  metadata?: ChatMessageMetadata,
  replyToMessageId?: number | null,
): Promise<ChatMessage> => {
  return createMessage(senderId, conversationId, {
    messageType: "text",
    content,
    metadata,
    replyToMessageId,
  });
};

const getCocktailShareMetadata = async (
  userId: number,
  cocktailId: string,
  cocktailType: ChatCocktailType,
): Promise<ChatMessageMetadata> => {
  if (cocktailType === "catalog") {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT id, name, image FROM catalog_cocktails WHERE id = ?",
      [cocktailId],
    );

    if (rows.length === 0) {
      throw new ServiceError("Catalog cocktail not found", 404);
    }

    return {
      cocktailId,
      cocktailType,
      cocktailName: rows[0].name,
      cocktailImage: rows[0].image,
    };
  }

  if (cocktailType === "public") {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT pc.id, pc.name, pc.image, pc.author_id, u.nickname AS author_nickname, u.avatar AS author_avatar
       FROM public_cocktails pc
       JOIN users u ON pc.author_id = u.id
       WHERE pc.id = ?`,
      [Number(cocktailId)],
    );

    if (rows.length === 0) {
      throw new ServiceError("Public cocktail not found", 404);
    }

    return {
      cocktailId,
      cocktailType,
      cocktailName: rows[0].name,
      cocktailImage: rows[0].image,
      authorId: Number(rows[0].author_id),
      authorNickname: rows[0].author_nickname,
      authorAvatar: rows[0].author_avatar,
    };
  }

  if (cocktailType === "user") {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT id, name, image FROM user_cocktails WHERE id = ? AND owner_id = ?",
      [Number(cocktailId), userId],
    );

    if (rows.length === 0) {
      throw new ServiceError("User cocktail not found", 404);
    }

    return {
      cocktailId,
      cocktailType,
      cocktailName: rows[0].name,
      cocktailImage: rows[0].image,
    };
  }

  throw new ServiceError("Invalid cocktail type", 400);
};

export const sendCocktailShareMessage = async (
  senderId: number,
  conversationId: number,
  cocktailId: string,
  cocktailType: ChatCocktailType,
  content?: string | null,
  replyToMessageId?: number | null,
): Promise<ChatMessage> => {
  const metadata = await getCocktailShareMetadata(
    senderId,
    cocktailId,
    cocktailType,
  );

  return createMessage(senderId, conversationId, {
    messageType: "cocktail_share",
    content,
    replyToMessageId,
    metadata,
  });
};

export const sendAttachmentMessage = async (
  senderId: number,
  conversationId: number,
  file: Express.Multer.File,
  messageType: ChatAttachmentMessageType,
  content?: string | null,
  replyToMessageId?: number | null,
  durationSeconds?: number | null,
  waveformLevels?: number[] | null,
): Promise<ChatMessage> => {
  if (!["image", "video", "file", "voice"].includes(messageType)) {
    throw new ServiceError("Invalid attachment message type", 400);
  }

  if (messageType === "image" && !file.mimetype.startsWith("image/")) {
    throw new ServiceError("Attachment is not an image", 400);
  }

  if (messageType === "video" && !file.mimetype.startsWith("video/")) {
    throw new ServiceError("Attachment is not a video", 400);
  }

  if (messageType === "voice" && !file.mimetype.startsWith("audio/")) {
    throw new ServiceError("Attachment is not an audio file", 400);
  }

  return createMessage(senderId, conversationId, {
    messageType,
    content,
    replyToMessageId,
    metadata: {
      fileUrl: `/uploads/chat/${file.filename}`,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      durationSeconds: durationSeconds ?? null,
      waveformLevels: waveformLevels ?? [],
    },
  });
};

const withMessageState = async (
  userId: number,
  messages: ChatMessage[],
): Promise<ChatMessage[]> => {
  if (messages.length === 0) {
    return messages;
  }

  const messageIds = messages.map((message) => Number(message.id));
  const [reactionRows] = await db.query<RowDataPacket[]>(
    `SELECT
       message_id,
       emoji,
       COUNT(*) AS count,
       MAX(user_id = ?) AS reacted_by_me
     FROM message_reactions
     WHERE message_id IN (?)
     GROUP BY message_id, emoji`,
    [userId, messageIds],
  );
  const [pinRows] = await db.query<RowDataPacket[]>(
    "SELECT message_id FROM message_pins WHERE message_id IN (?)",
    [messageIds],
  );

  const reactionsByMessage = new Map<number, MessageReactionSummary[]>();
  reactionRows.forEach((row) => {
    const messageId = Number(row.message_id);
    const reactions = reactionsByMessage.get(messageId) ?? [];

    reactions.push({
      emoji: String(row.emoji),
      count: Number(row.count),
      reactedByMe: Boolean(row.reacted_by_me),
    });
    reactionsByMessage.set(messageId, reactions);
  });

  const pinnedMessageIds = new Set(
    pinRows.map((row) => Number(row.message_id)),
  );

  return messages.map((message) => ({
    ...message,
    reactions: reactionsByMessage.get(Number(message.id)) ?? [],
    is_pinned: pinnedMessageIds.has(Number(message.id)),
  }));
};

export const markConversationAsRead = async (
  userId: number,
  conversationId: number,
): Promise<void> => {
  await ensureVisibleConversationAccess(userId, conversationId);

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id
     FROM messages
     WHERE conversation_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
    [conversationId],
  );

  if (rows.length === 0) {
    await db.query(
      `UPDATE conversation_participants
       SET is_marked_unread = FALSE
       WHERE conversation_id = ? AND user_id = ?`,
      [conversationId, userId],
    );
    return;
  }

  const lastMessageId = Number(rows[0].id);

  await db.query(
    `UPDATE conversation_participants
     SET last_read_message_id = ?,
         is_marked_unread = FALSE
     WHERE conversation_id = ? AND user_id = ?`,
    [lastMessageId, conversationId, userId],
  );

  await db.query(
    `INSERT INTO message_reads (message_id, user_id)
     SELECT id, ?
     FROM messages
     WHERE conversation_id = ?
     ON DUPLICATE KEY UPDATE read_at = NOW()`,
    [userId, conversationId],
  );
};

export const markConversationAsUnread = async (
  userId: number,
  conversationId: number,
): Promise<void> => {
  await ensureVisibleConversationAccess(userId, conversationId);

  await db.query(
    `UPDATE conversation_participants
     SET is_marked_unread = TRUE
     WHERE conversation_id = ? AND user_id = ?`,
    [conversationId, userId],
  );
};

export const setConversationPinned = async (
  userId: number,
  conversationId: number,
  isPinned: boolean,
): Promise<void> => {
  await ensureVisibleConversationAccess(userId, conversationId);

  await db.query(
    `UPDATE conversation_participants
     SET is_pinned = ?
     WHERE conversation_id = ? AND user_id = ?`,
    [isPinned, conversationId, userId],
  );
};

const getVisibleMessageForUser = async (
  userId: number,
  messageId: number,
): Promise<ChatMessage> => {
  ensureInteger(messageId, "Invalid message id");

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT m.*, u.nickname AS sender_nickname, u.avatar AS sender_avatar
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     JOIN conversation_participants cp
       ON cp.conversation_id = m.conversation_id
      AND cp.user_id = ?
      AND cp.deleted_at IS NULL
     LEFT JOIN message_deletions md
       ON md.message_id = m.id AND md.user_id = ?
     WHERE m.id = ?
       AND m.deleted_at IS NULL
       AND md.message_id IS NULL
     LIMIT 1`,
    [userId, userId, messageId],
  );

  if (rows.length === 0) {
    throw new ServiceError("Message not found", 404);
  }

  return parseMetadata(rows[0] as ChatMessage);
};

export const forwardMessage = async (
  userId: number,
  messageId: number,
  targetConversationId: number,
): Promise<ChatMessage> => {
  ensureInteger(targetConversationId, "Invalid conversation id");

  const sourceMessage = await getVisibleMessageForUser(userId, messageId);
  await ensureVisibleConversationAccess(userId, targetConversationId);

  const sourceMetadata =
    sourceMessage.metadata && typeof sourceMessage.metadata === "object"
      ? sourceMessage.metadata
      : {};

  return createMessage(userId, targetConversationId, {
    messageType: sourceMessage.message_type,
    content: sourceMessage.content,
    metadata: {
      ...sourceMetadata,
      forwardedFromMessageId: Number(sourceMessage.id),
      forwardedFromUserId: Number(sourceMessage.sender_id),
      forwardedFromNickname: sourceMessage.sender_nickname,
    } as ChatMessageMetadata,
  });
};

export const setMessageReaction = async (
  userId: number,
  messageId: number,
  emoji: string,
): Promise<ChatMessage> => {
  const message = await getVisibleMessageForUser(userId, messageId);
  const normalizedEmoji = emoji.trim();

  if (!normalizedEmoji || normalizedEmoji.length > 16) {
    throw new ServiceError("Invalid emoji reaction", 400);
  }

  await db.query(
    `INSERT INTO message_reactions (message_id, user_id, emoji)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE emoji = VALUES(emoji), updated_at = NOW()`,
    [messageId, userId, normalizedEmoji],
  );

  const [updatedMessage] = await withMessageState(userId, [message]);
  return updatedMessage;
};

export const removeMessageReaction = async (
  userId: number,
  messageId: number,
): Promise<ChatMessage> => {
  const message = await getVisibleMessageForUser(userId, messageId);

  await db.query(
    "DELETE FROM message_reactions WHERE message_id = ? AND user_id = ?",
    [messageId, userId],
  );

  const [updatedMessage] = await withMessageState(userId, [message]);
  return updatedMessage;
};

export const pinMessage = async (
  userId: number,
  messageId: number,
): Promise<ChatMessage> => {
  const message = await getVisibleMessageForUser(userId, messageId);

  await db.query(
    `INSERT IGNORE INTO message_pins (conversation_id, message_id, pinned_by)
     VALUES (?, ?, ?)`,
    [message.conversation_id, messageId, userId],
  );

  const [updatedMessage] = await withMessageState(userId, [message]);
  return updatedMessage;
};

export const unpinMessage = async (
  userId: number,
  messageId: number,
): Promise<ChatMessage> => {
  const message = await getVisibleMessageForUser(userId, messageId);

  await db.query("DELETE FROM message_pins WHERE message_id = ?", [messageId]);

  const [updatedMessage] = await withMessageState(userId, [message]);
  return updatedMessage;
};

export const deleteConversationForUser = async (
  userId: number,
  conversationId: number,
): Promise<void> => {
  await ensureVisibleConversationAccess(userId, conversationId);

  await db.query(
    `UPDATE conversation_participants
     SET deleted_at = NOW(),
         is_pinned = FALSE,
         is_marked_unread = FALSE
     WHERE conversation_id = ? AND user_id = ?`,
    [conversationId, userId],
  );
};

export const deleteConversationForEveryone = async (
  userId: number,
  conversationId: number,
): Promise<{ conversationId: number; participantIds: number[] }> => {
  const participantIds = await ensureVisibleConversationAccess(
    userId,
    conversationId,
  );

  await db.query(
    `UPDATE conversation_participants
     SET deleted_at = NOW(),
         is_pinned = FALSE,
         is_marked_unread = FALSE
     WHERE conversation_id = ?`,
    [conversationId],
  );

  return { conversationId, participantIds };
};

export const deleteMessageForUser = async (
  userId: number,
  messageId: number,
): Promise<void> => {
  ensureInteger(messageId, "Invalid message id");

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT m.id, m.conversation_id
     FROM messages m
     JOIN conversation_participants cp
       ON cp.conversation_id = m.conversation_id
      AND cp.user_id = ?
     WHERE m.id = ?`,
    [userId, messageId],
  );

  if (rows.length === 0) {
    throw new ServiceError("Message not found", 404);
  }

  await db.query(
    `INSERT INTO message_deletions (message_id, user_id)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE deleted_at = NOW()`,
    [messageId, userId],
  );
};

const getAttachmentFilePath = (
  metadata: string | ChatMessageMetadata | null,
): string | null => {
  if (!metadata) {
    return null;
  }

  const parsed =
    typeof metadata === "string" ? JSON.parse(metadata) : metadata;

  if (
    parsed &&
    "fileUrl" in parsed &&
    typeof parsed.fileUrl === "string" &&
    parsed.fileUrl.startsWith("/uploads/chat/")
  ) {
    return parsed.fileUrl;
  }

  return null;
};

export const deleteMessageForEveryone = async (
  userId: number,
  messageId: number,
): Promise<{ conversationId: number; messageId: number }> => {
  ensureInteger(messageId, "Invalid message id");

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT m.*
     FROM messages m
     JOIN conversation_participants cp
       ON cp.conversation_id = m.conversation_id
      AND cp.user_id = ?
     WHERE m.id = ?`,
    [userId, messageId],
  );

  if (rows.length === 0) {
    throw new ServiceError("Message not found", 404);
  }

  const message = rows[0] as ChatMessage;

  if (Number(message.sender_id) !== Number(userId)) {
    throw new ServiceError("Only message sender can delete it for everyone", 403);
  }

  if (message.deleted_at) {
    return {
      conversationId: Number(message.conversation_id),
      messageId,
    };
  }

  const filePath = getAttachmentFilePath(message.metadata);

  await db.query<ResultSetHeader>(
    `UPDATE messages
     SET deleted_at = NOW(),
         content = NULL,
         metadata = NULL
     WHERE id = ?`,
    [messageId],
  );

  await db.query("UPDATE conversations SET updated_at = NOW() WHERE id = ?", [
    message.conversation_id,
  ]);

  await deleteUploadedFile(filePath);

  return {
    conversationId: Number(message.conversation_id),
    messageId,
  };
};
