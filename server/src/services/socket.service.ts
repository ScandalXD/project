import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { db } from "../config/db";
import { JwtPayload, verifyToken } from "./token.service";
import {
  getConversationParticipantsForUser,
  markConversationAsRead,
  sendTextMessage,
} from "./chat.service";

type ClientToServerEvents = {
  join_conversation: (
    payload: { conversationId: number },
    callback?: (response: SocketResponse) => void,
  ) => void;
  leave_conversation: (payload: { conversationId: number }) => void;
  send_message: (
    payload: {
      conversationId: number;
      content: string;
      replyToMessageId?: number | null;
    },
    callback?: (response: SocketResponse) => void,
  ) => void;
  typing_start: (payload: { conversationId: number }) => void;
  typing_stop: (payload: { conversationId: number }) => void;
  message_seen: (
    payload: { conversationId: number },
    callback?: (response: SocketResponse) => void,
  ) => void;
};

type ServerToClientEvents = {
  receive_message: (payload: unknown) => void;
  message_deleted: (payload: { conversationId: number; messageId: number }) => void;
  conversation_removed: (payload: { conversationId: number }) => void;
  typing_start: (payload: { conversationId: number; userId: number }) => void;
  typing_stop: (payload: { conversationId: number; userId: number }) => void;
  message_seen: (payload: { conversationId: number; userId: number }) => void;
  user_online: (payload: { userId: number }) => void;
  user_offline: (payload: { userId: number; lastSeenAt: string }) => void;
  conversation_updated: (payload: { conversationId: number }) => void;
  chat_error: (payload: { message: string }) => void;
};

type SocketResponse =
  | { ok: true; data?: unknown }
  | { ok: false; message: string };

type ChatSocket = Socket<ClientToServerEvents, ServerToClientEvents> & {
  data: {
    user: JwtPayload;
  };
};

let chatIo: Server<ClientToServerEvents, ServerToClientEvents> | null = null;

const getTokenFromSocket = (socket: Socket): string | null => {
  const authToken = socket.handshake.auth?.token;

  if (typeof authToken === "string" && authToken.trim()) {
    return authToken;
  }

  const authHeader = socket.handshake.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return null;
};

const getConversationRoom = (conversationId: number) =>
  `conversation:${conversationId}`;

const getUserRoom = (userId: number) => `user:${userId}`;

const updateUserOnlineStatus = async (userId: number, isOnline: boolean) => {
  await db.query(
    `INSERT INTO user_chat_status (user_id, is_online, last_seen_at)
     VALUES (?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       is_online = VALUES(is_online),
       last_seen_at = NOW()`,
    [userId, isOnline],
  );
};

const emitUserPresence = (
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  userId: number,
  isOnline: boolean,
) => {
  if (isOnline) {
    io.emit("user_online", { userId });
    return;
  }

  io.emit("user_offline", {
    userId,
    lastSeenAt: new Date().toISOString(),
  });
};

export const initializeChatSocket = (httpServer: HttpServer) => {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  chatIo = io;

  io.use((socket, next) => {
    const token = getTokenFromSocket(socket);

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    try {
      const decoded = verifyToken(token);
      (socket as ChatSocket).data.user = decoded;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", async (socket) => {
    const chatSocket = socket as ChatSocket;
    const userId = chatSocket.data.user.id;

    chatSocket.join(getUserRoom(userId));
    await updateUserOnlineStatus(userId, true);
    emitUserPresence(io, userId, true);

    chatSocket.on("join_conversation", async ({ conversationId }, callback) => {
      try {
        await getConversationParticipantsForUser(userId, Number(conversationId));
        chatSocket.join(getConversationRoom(Number(conversationId)));
        callback?.({ ok: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Join failed";
        callback?.({ ok: false, message });
        chatSocket.emit("chat_error", { message });
      }
    });

    chatSocket.on("leave_conversation", ({ conversationId }) => {
      chatSocket.leave(getConversationRoom(Number(conversationId)));
    });

    chatSocket.on("send_message", async (payload, callback) => {
      try {
        const message = await sendTextMessage(
          userId,
          Number(payload.conversationId),
          payload.content,
          payload.replyToMessageId,
        );

        io.to(getConversationRoom(Number(payload.conversationId))).emit(
          "receive_message",
          message,
        );
        io.to(getConversationRoom(Number(payload.conversationId))).emit(
          "conversation_updated",
          {
            conversationId: Number(payload.conversationId),
          },
        );

        callback?.({ ok: true, data: message });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to send message";
        callback?.({ ok: false, message });
        chatSocket.emit("chat_error", { message });
      }
    });

    chatSocket.on("typing_start", ({ conversationId }) => {
      chatSocket
        .to(getConversationRoom(Number(conversationId)))
        .emit("typing_start", {
          conversationId: Number(conversationId),
          userId,
        });
    });

    chatSocket.on("typing_stop", ({ conversationId }) => {
      chatSocket
        .to(getConversationRoom(Number(conversationId)))
        .emit("typing_stop", {
          conversationId: Number(conversationId),
          userId,
        });
    });

    chatSocket.on("message_seen", async ({ conversationId }, callback) => {
      try {
        await markConversationAsRead(userId, Number(conversationId));

        io.to(getConversationRoom(Number(conversationId))).emit("message_seen", {
          conversationId: Number(conversationId),
          userId,
        });

        callback?.({ ok: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Seen failed";
        callback?.({ ok: false, message });
        chatSocket.emit("chat_error", { message });
      }
    });

    chatSocket.on("disconnect", async () => {
      await updateUserOnlineStatus(userId, false);
      emitUserPresence(io, userId, false);
    });
  });

  return io;
};

export const emitMessageDeleted = (
  conversationId: number,
  messageId: number,
) => {
  chatIo?.to(getConversationRoom(conversationId)).emit("message_deleted", {
    conversationId,
    messageId,
  });

  chatIo?.to(getConversationRoom(conversationId)).emit("conversation_updated", {
    conversationId,
  });
};

export const emitConversationRemoved = (
  conversationId: number,
  participantIds: number[],
) => {
  participantIds.forEach((participantId) => {
    chatIo?.to(getUserRoom(participantId)).emit("conversation_removed", {
      conversationId,
    });
  });

  chatIo?.to(getConversationRoom(conversationId)).emit("conversation_removed", {
    conversationId,
  });
};
