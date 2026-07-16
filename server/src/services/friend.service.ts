import { RowDataPacket, ResultSetHeader } from "mysql2";
import { db } from "../config/db";
import {
  Friendship,
  FriendshipStatus,
  UserSearchResult,
} from "../models/Friendship.model";
import { ServiceError } from "./cocktail.service";
import { createNotification } from "./notificationEvent.service";

const normalizeSearchQuery = (query: string): string => query.trim();

const getFriendshipBetweenUsers = async (
  userId: number,
  otherUserId: number,
): Promise<Friendship | null> => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT *
     FROM friendships
     WHERE (requester_id = ? AND receiver_id = ?)
        OR (requester_id = ? AND receiver_id = ?)
     LIMIT 1`,
    [userId, otherUserId, otherUserId, userId],
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0] as Friendship;
};

const havePrivateConversation = async (
  userId: number,
  otherUserId: number,
): Promise<boolean> => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT c.id
     FROM conversations c
     JOIN conversation_participants cp1
       ON cp1.conversation_id = c.id AND cp1.user_id = ?
     JOIN conversation_participants cp2
       ON cp2.conversation_id = c.id AND cp2.user_id = ?
     WHERE c.type = 'private'
     LIMIT 1`,
    [userId, otherUserId],
  );

  return rows.length > 0;
};

const ensureValidUserId = (userId: number) => {
  if (!Number.isInteger(userId)) {
    throw new ServiceError("Invalid user id", 400);
  }
};

const getExistingUser = async (userId: number) => {
  ensureValidUserId(userId);

  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT id, nickname FROM users WHERE id = ? AND is_active = TRUE",
    [userId],
  );

  if (rows.length === 0) {
    throw new ServiceError("User not found", 404);
  }

  return rows[0] as { id: number; nickname: string };
};

export const searchUsersForFriends = async (
  currentUserId: number,
  query: string,
): Promise<UserSearchResult[]> => {
  const normalizedQuery = normalizeSearchQuery(query);

  if (normalizedQuery.length < 2) {
    throw new ServiceError("Search query must be at least 2 characters", 400);
  }

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT
       u.id,
       u.nickname,
       f.status AS relationship_status,
       CASE
         WHEN f.requester_id = ? THEN 'outgoing'
         WHEN f.receiver_id = ? THEN 'incoming'
         ELSE NULL
       END AS relationship_direction
     FROM users u
     LEFT JOIN friendships f
       ON (
         (f.requester_id = ? AND f.receiver_id = u.id)
         OR (f.requester_id = u.id AND f.receiver_id = ?)
       )
     WHERE u.id != ?
       AND u.is_active = TRUE
       AND u.nickname LIKE ?
     ORDER BY u.nickname ASC
     LIMIT 20`,
    [
      currentUserId,
      currentUserId,
      currentUserId,
      currentUserId,
      currentUserId,
      `%${normalizedQuery}%`,
    ],
  );

  return rows as UserSearchResult[];
};

export const sendFriendRequest = async (
  requesterId: number,
  receiverId: number,
): Promise<number> => {
  ensureValidUserId(receiverId);

  if (requesterId === receiverId) {
    throw new ServiceError("You cannot send a friend request to yourself", 400);
  }

  await getExistingUser(receiverId);

  const existing = await getFriendshipBetweenUsers(requesterId, receiverId);

  if (existing) {
    if (existing.status === "blocked") {
      throw new ServiceError("Friend request is not allowed", 403);
    }

    if (existing.status === "accepted") {
      throw new ServiceError("You are already friends", 409);
    }

    if (existing.status === "pending") {
      throw new ServiceError("Friend request already exists", 409);
    }

    const [result] = await db.query<ResultSetHeader>(
      `UPDATE friendships
       SET requester_id = ?,
           receiver_id = ?,
           status = 'pending',
           blocked_by = NULL,
           responded_at = NULL
       WHERE id = ?`,
      [requesterId, receiverId, existing.id],
    );

    if (result.affectedRows === 0) {
      throw new ServiceError("Failed to send friend request", 400);
    }

    await createNotification({
      userId: receiverId,
      type: "friend_request_received",
      actorUserId: requesterId,
    });

    return existing.id;
  }

  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO friendships (requester_id, receiver_id, status)
     VALUES (?, ?, 'pending')`,
    [requesterId, receiverId],
  );

  await createNotification({
    userId: receiverId,
    type: "friend_request_received",
    actorUserId: requesterId,
  });

  return result.insertId;
};

export const acceptFriendRequest = async (
  userId: number,
  friendshipId: number,
): Promise<void> => {
  ensureValidUserId(friendshipId);

  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM friendships WHERE id = ?",
    [friendshipId],
  );

  if (rows.length === 0) {
    throw new ServiceError("Friend request not found", 404);
  }

  const friendship = rows[0] as Friendship;

  if (Number(friendship.receiver_id) !== Number(userId)) {
    throw new ServiceError("Only request receiver can accept it", 403);
  }

  if (friendship.status !== "pending") {
    throw new ServiceError("Friend request is not pending", 409);
  }

  await db.query<ResultSetHeader>(
    `UPDATE friendships
     SET status = 'accepted',
         responded_at = NOW()
     WHERE id = ?`,
    [friendshipId],
  );

  await createNotification({
    userId: Number(friendship.requester_id),
    type: "friend_request_accepted",
    actorUserId: userId,
  });
};

export const rejectFriendRequest = async (
  userId: number,
  friendshipId: number,
): Promise<void> => {
  ensureValidUserId(friendshipId);

  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM friendships WHERE id = ?",
    [friendshipId],
  );

  if (rows.length === 0) {
    throw new ServiceError("Friend request not found", 404);
  }

  const friendship = rows[0] as Friendship;

  if (Number(friendship.receiver_id) !== Number(userId)) {
    throw new ServiceError("Only request receiver can reject it", 403);
  }

  if (friendship.status !== "pending") {
    throw new ServiceError("Friend request is not pending", 409);
  }

  await db.query<ResultSetHeader>(
    `UPDATE friendships
     SET status = 'rejected',
         responded_at = NOW()
     WHERE id = ?`,
    [friendshipId],
  );
};

export const removeFriend = async (
  userId: number,
  friendId: number,
): Promise<void> => {
  ensureValidUserId(friendId);

  const [result] = await db.query<ResultSetHeader>(
    `DELETE FROM friendships
     WHERE status = 'accepted'
       AND (
         (requester_id = ? AND receiver_id = ?)
         OR (requester_id = ? AND receiver_id = ?)
       )`,
    [userId, friendId, friendId, userId],
  );

  if (result.affectedRows === 0) {
    throw new ServiceError("Friendship not found", 404);
  }
};

export const blockUser = async (
  userId: number,
  blockedUserId: number,
): Promise<void> => {
  ensureValidUserId(blockedUserId);

  if (userId === blockedUserId) {
    throw new ServiceError("You cannot block yourself", 400);
  }

  await getExistingUser(blockedUserId);

  const existing = await getFriendshipBetweenUsers(userId, blockedUserId);

  if (existing) {
    await db.query<ResultSetHeader>(
      `UPDATE friendships
       SET requester_id = ?,
           receiver_id = ?,
           status = 'blocked',
           status_before_block = CASE
             WHEN status = 'blocked' THEN status_before_block
             ELSE status
           END,
           blocked_by = ?,
           responded_at = NOW()
       WHERE id = ?`,
      [userId, blockedUserId, userId, existing.id],
    );
    return;
  }

  await db.query<ResultSetHeader>(
    `INSERT INTO friendships (requester_id, receiver_id, status, blocked_by, responded_at)
     VALUES (?, ?, 'blocked', ?, NOW())`,
    [userId, blockedUserId, userId],
  );
};

export const unblockUser = async (
  userId: number,
  blockedUserId: number,
): Promise<void> => {
  ensureValidUserId(blockedUserId);

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT *
     FROM friendships
     WHERE status = 'blocked'
       AND blocked_by = ?
       AND (
         (requester_id = ? AND receiver_id = ?)
         OR (requester_id = ? AND receiver_id = ?)
       )
     LIMIT 1`,
    [userId, userId, blockedUserId, blockedUserId, userId],
  );

  if (rows.length === 0) {
    throw new ServiceError("Blocked user not found", 404);
  }

  const friendship = rows[0] as Friendship;
  const shouldRestoreFriendship =
    friendship.status_before_block === "accepted" ||
    (friendship.status_before_block === null &&
      (await havePrivateConversation(userId, blockedUserId)));

  if (shouldRestoreFriendship) {
    await db.query<ResultSetHeader>(
      `UPDATE friendships
       SET status = 'accepted',
           status_before_block = NULL,
           blocked_by = NULL,
           responded_at = NOW()
       WHERE id = ?`,
      [friendship.id],
    );
    return;
  }

  await db.query<ResultSetHeader>("DELETE FROM friendships WHERE id = ?", [
    friendship.id,
  ]);
};

export const getFriendRequests = async (
  userId: number,
): Promise<{
  incoming: Friendship[];
  outgoing: Friendship[];
}> => {
  const [incomingRows] = await db.query<RowDataPacket[]>(
    `SELECT f.*, u.nickname AS requester_nickname
     FROM friendships f
     JOIN users u ON f.requester_id = u.id
     WHERE f.receiver_id = ?
       AND f.status = 'pending'
     ORDER BY f.created_at DESC`,
    [userId],
  );

  const [outgoingRows] = await db.query<RowDataPacket[]>(
    `SELECT f.*, u.nickname AS receiver_nickname
     FROM friendships f
     JOIN users u ON f.receiver_id = u.id
     WHERE f.requester_id = ?
       AND f.status = 'pending'
     ORDER BY f.created_at DESC`,
    [userId],
  );

  return {
    incoming: incomingRows as Friendship[],
    outgoing: outgoingRows as Friendship[],
  };
};

export const getFriends = async (userId: number): Promise<Friendship[]> => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT
       f.*,
       CASE
         WHEN f.requester_id = ? THEN f.receiver_id
         ELSE f.requester_id
       END AS friend_id,
       friend.nickname AS friend_nickname
     FROM friendships f
     JOIN users friend
       ON friend.id = CASE
         WHEN f.requester_id = ? THEN f.receiver_id
         ELSE f.requester_id
       END
     WHERE f.status = 'accepted'
       AND (f.requester_id = ? OR f.receiver_id = ?)
     ORDER BY friend.nickname ASC`,
    [userId, userId, userId, userId],
  );

  return rows as Friendship[];
};

export const getBlockedUsers = async (
  userId: number,
): Promise<Friendship[]> => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT f.*, u.nickname AS receiver_nickname
     FROM friendships f
     JOIN users u ON f.receiver_id = u.id
     WHERE f.blocked_by = ?
       AND f.status = 'blocked'
     ORDER BY f.updated_at DESC`,
    [userId],
  );

  return rows as Friendship[];
};

export const areUsersFriends = async (
  userId: number,
  otherUserId: number,
): Promise<boolean> => {
  const friendship = await getFriendshipBetweenUsers(userId, otherUserId);
  return friendship?.status === "accepted";
};

export const getRelationshipStatus = async (
  userId: number,
  otherUserId: number,
): Promise<FriendshipStatus | null> => {
  const friendship = await getFriendshipBetweenUsers(userId, otherUserId);
  return friendship?.status ?? null;
};
