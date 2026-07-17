import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { chatApi } from "../../api/chatApi";
import ChatSidebar from "../../components/chat/ChatSidebar";
import ChatWindow from "../../components/chat/ChatWindow";
import { ConfirmModal } from "../../components/ui/Modal";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";
import type { ChatMessage, ConversationListItem } from "../../types/chat";
import { isEnabledFlag } from "../../utils/booleanFlag";

const LAST_CHAT_CONVERSATION_KEY = "cocktailapp:lastChatConversationId";

export default function ChatPage() {
  const { user, token } = useAuth();
  const { socket, isConnected, error: socketError } = useSocket(token);
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const [typingUserIds, setTypingUserIds] = useState<number[]>([]);
  const [isMobileConversationOpen, setIsMobileConversationOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    conversationId: number;
    mode: "me" | "everyone";
  } | null>(null);

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === activeConversationId,
      ) ?? null,
    [activeConversationId, conversations],
  );

  const loadConversations = async () => {
    try {
      setError("");
      const data = await chatApi.getConversations();
      setConversations(data);

      const conversationIdFromUrl = Number(searchParams.get("conversationId"));
      const conversationIdFromStorage = Number(
        window.sessionStorage.getItem(LAST_CHAT_CONVERSATION_KEY),
      );
      const preferredConversationId =
        conversationIdFromUrl || conversationIdFromStorage;
      const hasConversationFromUrl = data.some(
        (conversation) => conversation.id === preferredConversationId,
      );

      if (hasConversationFromUrl) {
        setActiveConversationId(preferredConversationId);
        setIsMobileConversationOpen(true);
      } else if (!activeConversationId && data.length > 0) {
        setActiveConversationId(data[0].id);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load chats.");
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: number) => {
    setIsLoadingMessages(true);

    try {
      setError("");
      const data = await chatApi.getMessages(conversationId);
      setMessages(data);
      await chatApi.markAsRead(conversationId);
      socket?.emit("message_seen", { conversationId });
      await loadConversations();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load messages.");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  useEffect(() => {
    if (!socket || !activeConversationId) return;

    socket.emit("join_conversation", { conversationId: activeConversationId });

    return () => {
      socket.emit("leave_conversation", { conversationId: activeConversationId });
    };
  }, [socket, activeConversationId]);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message: ChatMessage) => {
      if (message.conversation_id === activeConversationId) {
        setMessages((prev) => {
          if (prev.some((item) => item.id === message.id)) return prev;
          return [...prev, message];
        });

        chatApi.markAsRead(message.conversation_id);
        socket.emit("message_seen", { conversationId: message.conversation_id });
      }

      loadConversations();
    };

    const handleConversationUpdated = () => {
      loadConversations();
    };

    const handleMessageUpdated = (message: ChatMessage) => {
      if (message.conversation_id === activeConversationId) {
        setMessages((prev) =>
          prev.map((item) => (item.id === message.id ? message : item)),
        );
      }
    };

    const handleMessageSeen = (payload: {
      conversationId: number;
      userId: number;
    }) => {
      if (
        payload.conversationId !== activeConversationId ||
        payload.userId === user?.id
      ) {
        return;
      }

      setMessages((prev) =>
        prev.map((message) =>
          message.sender_id === user?.id
            ? { ...message, is_read_by_recipient: true }
            : message,
        ),
      );
    };

    const handleMessageDeleted = (payload: {
      conversationId: number;
      messageId: number;
    }) => {
      if (payload.conversationId === activeConversationId) {
        setMessages((prev) =>
          prev.filter((message) => message.id !== payload.messageId),
        );
      }

      loadConversations();
    };

    const handleConversationRemoved = (payload: { conversationId: number }) => {
      setConversations((prev) =>
        prev.filter((conversation) => conversation.id !== payload.conversationId),
      );

      if (payload.conversationId === activeConversationId) {
        setActiveConversationId(null);
        setMessages([]);
      }
    };

    const handleTypingStart = (payload: { conversationId: number; userId: number }) => {
      if (payload.conversationId !== activeConversationId || payload.userId === user?.id) {
        return;
      }

      setTypingUserIds((prev) =>
        prev.includes(payload.userId) ? prev : [...prev, payload.userId],
      );
    };

    const handleTypingStop = (payload: { conversationId: number; userId: number }) => {
      setTypingUserIds((prev) =>
        prev.filter((userId) => userId !== payload.userId),
      );
    };

    const handlePresence = () => {
      loadConversations();
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_updated", handleMessageUpdated);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("conversation_removed", handleConversationRemoved);
    socket.on("conversation_updated", handleConversationUpdated);
    socket.on("message_seen", handleMessageSeen);
    socket.on("typing_start", handleTypingStart);
    socket.on("typing_stop", handleTypingStop);
    socket.on("user_online", handlePresence);
    socket.on("user_offline", handlePresence);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("message_updated", handleMessageUpdated);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("conversation_removed", handleConversationRemoved);
      socket.off("conversation_updated", handleConversationUpdated);
      socket.off("message_seen", handleMessageSeen);
      socket.off("typing_start", handleTypingStart);
      socket.off("typing_stop", handleTypingStop);
      socket.off("user_online", handlePresence);
      socket.off("user_offline", handlePresence);
    };
  }, [socket, activeConversationId, user?.id]);

  const handleMessagesChanged = async () => {
    if (!activeConversationId) return;

    await loadMessages(activeConversationId);
  };

  const handleSelectConversation = (conversationId: number) => {
    setActiveConversationId(conversationId);
    setIsMobileConversationOpen(true);
    window.sessionStorage.setItem(
      LAST_CHAT_CONVERSATION_KEY,
      String(conversationId),
    );
    setSearchParams({ conversationId: String(conversationId) });
  };

  const handleBackToChats = () => {
    setIsMobileConversationOpen(false);
    window.sessionStorage.removeItem(LAST_CHAT_CONVERSATION_KEY);
    setSearchParams({});
  };

  const handleTogglePin = async (conversation: ConversationListItem) => {
    if (isEnabledFlag(conversation.is_pinned)) {
      await chatApi.unpinConversation(conversation.id);
    } else {
      await chatApi.pinConversation(conversation.id);
    }

    await loadConversations();
  };

  const handleToggleRead = async (conversation: ConversationListItem) => {
    if (conversation.unread_count > 0) {
      await chatApi.markAsRead(conversation.id);
    } else {
      await chatApi.markAsUnread(conversation.id);
    }

    await loadConversations();
  };

  const handleDeleteConversationForMe = async (conversationId: number) => {
    await chatApi.deleteConversation(conversationId);
    setConversations((prev) =>
      prev.filter((conversation) => conversation.id !== conversationId),
    );

    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setMessages([]);
    }

    await loadConversations();
  };

  const handleDeleteConversationForEveryone = async (conversationId: number) => {
    await chatApi.deleteConversationForEveryone(conversationId);
    setConversations((prev) =>
      prev.filter((conversation) => conversation.id !== conversationId),
    );

    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setMessages([]);
    }

    await loadConversations();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="page-container chat-page">
      {(error || socketError) && (
        <p className="error-text chat-page-error">{error || socketError}</p>
      )}

      <div
        className={`chat-shell card ${
          isMobileConversationOpen
            ? "chat-mobile-conversation"
            : "chat-mobile-list"
        }`}
      >
        {isLoadingConversations ? (
          <div className="chat-loading">Loading chats...</div>
        ) : (
          <>
            <ChatSidebar
              conversations={conversations}
              activeConversationId={activeConversationId}
              currentUserId={user.id}
              onSelect={handleSelectConversation}
              onTogglePin={handleTogglePin}
              onToggleRead={handleToggleRead}
              onDeleteForMe={async (conversationId) =>
                setPendingDelete({ conversationId, mode: "me" })
              }
              onDeleteForEveryone={async (conversationId) =>
                setPendingDelete({ conversationId, mode: "everyone" })
              }
            />

            <ChatWindow
              conversation={activeConversation}
              conversations={conversations}
              currentUserId={user.id}
              messages={messages}
              isLoading={isLoadingMessages}
              socket={socket}
              isSocketConnected={isConnected}
              typingLabel={
                typingUserIds.length > 0
                  ? `${activeConversation?.other_user_nickname} is typing...`
                  : ""
              }
              onBack={handleBackToChats}
              onDeleteConversation={(conversationId) =>
                setPendingDelete({ conversationId, mode: "me" })
              }
              isMobileOpen={isMobileConversationOpen}
              onMessagesChanged={handleMessagesChanged}
            />
          </>
        )}
      </div>

      {pendingDelete && (
        <ConfirmModal
          title={
            pendingDelete.mode === "me"
              ? "Delete chat"
              : "Delete chat for everyone"
          }
          text={
            pendingDelete.mode === "me"
              ? "This chat will be removed only from your chat list."
              : "This chat will be removed for both participants."
          }
          confirmText="Delete"
          danger
          onCancel={() => setPendingDelete(null)}
          onConfirm={async () => {
            const target = pendingDelete;
            setPendingDelete(null);

            if (target.mode === "me") {
              await handleDeleteConversationForMe(target.conversationId);
            } else {
              await handleDeleteConversationForEveryone(target.conversationId);
            }
          }}
        />
      )}
    </div>
  );
}
