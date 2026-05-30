import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { Socket } from "socket.io-client";
import { chatApi } from "../../api/chatApi";
import { chatReportsApi } from "../../api/chatReportsApi";
import type { ChatMessage, ConversationListItem } from "../../types/chat";
import type { ChatReportReason } from "../../types/chatReport";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";
import Input from "../ui/Input";
import MessageBubble from "./MessageBubble";
import OnlineBadge from "./OnlineBadge";
import ReportMessageModal from "./ReportMessageModal";

interface ChatWindowProps {
  conversation: ConversationListItem | null;
  currentUserId: number;
  messages: ChatMessage[];
  isLoading: boolean;
  socket: Socket | null;
  isSocketConnected: boolean;
  typingLabel: string;
  onMessagesChanged: () => Promise<void>;
}

export default function ChatWindow({
  conversation,
  currentUserId,
  messages,
  isLoading,
  socket,
  isSocketConnected,
  typingLabel,
  onMessagesChanged,
}: ChatWindowProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [reportMessage, setReportMessage] = useState<ChatMessage | null>(null);
  const [isReportUserOpen, setIsReportUserOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [attachmentType, setAttachmentType] = useState<"image" | "file" | "voice">("file");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, conversation?.id]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);

    if (!selected) return;

    if (selected.type.startsWith("image/")) {
      setAttachmentType("image");
    } else if (selected.type.startsWith("audio/")) {
      setAttachmentType("voice");
    } else {
      setAttachmentType("file");
    }
  };

  const emitTyping = () => {
    if (!conversation || !socket || !isSocketConnected) return;

    socket.emit("typing_start", { conversationId: conversation.id });

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      socket.emit("typing_stop", { conversationId: conversation.id });
    }, 900);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!conversation) return;

    setError("");

    try {
      if (file) {
        await chatApi.sendAttachment(
          conversation.id,
          file,
          attachmentType,
          content.trim() || undefined,
          replyTo?.id ?? null,
        );
        await onMessagesChanged();
      } else if (socket && isSocketConnected) {
        await new Promise<void>((resolve, reject) => {
          socket.emit(
            "send_message",
            {
              conversationId: conversation.id,
              content,
              replyToMessageId: replyTo?.id ?? null,
            },
            (response: { ok: boolean; message?: string }) => {
              if (response.ok) {
                resolve();
              } else {
                reject(new Error(response.message || "Failed to send message."));
              }
            },
          );
        });
        await onMessagesChanged();
      } else {
        await chatApi.sendTextMessage(
          conversation.id,
          content,
          replyTo?.id ?? null,
        );
        await onMessagesChanged();
      }

      setContent("");
      setFile(null);
      setReplyTo(null);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to send message.",
      );
    }
  };

  const handleDelete = async (messageId: number) => {
    setError("");

    try {
      await chatApi.deleteMessage(messageId);
      await onMessagesChanged();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete message.");
    }
  };

  const handleDeleteForEveryone = async (messageId: number) => {
    setError("");

    try {
      await chatApi.deleteMessageForEveryone(messageId);
      await onMessagesChanged();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to delete message for everyone.",
      );
    }
  };

  const handleReportMessage = async (
    reason: ChatReportReason,
    details: string,
  ) => {
    if (!reportMessage) return;

    setError("");

    try {
      await chatReportsApi.createReport({
        targetType: "message",
        messageId: reportMessage.id,
        reason,
        details,
      });
      setReportMessage(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to report message.");
    }
  };

  const handleReportUser = async (
    reason: ChatReportReason,
    details: string,
  ) => {
    if (!conversation) return;

    setError("");

    try {
      await chatReportsApi.createReport({
        targetType: "user",
        targetUserId: conversation.other_user_id,
        reason,
        details,
      });
      setIsReportUserOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to report user.");
    }
  };

  if (!conversation) {
    return (
      <section className="chat-window chat-window-empty">
        <EmptyState text="Select a conversation to start chatting" />
      </section>
    );
  }

  return (
    <section className="chat-window">
      <div className="chat-window-header">
        <div className="chat-avatar" aria-hidden="true">
          {conversation.other_user_nickname.charAt(0).toUpperCase()}
        </div>

        <div className="chat-window-user">
          <div>
            <h2>{conversation.other_user_nickname}</h2>
            <OnlineBadge
              isOnline={conversation.is_online}
              lastSeenAt={conversation.last_seen_at}
            />
          </div>

          <Button
            variant="secondary"
            onClick={() => setIsReportUserOpen(true)}
          >
            Report user
          </Button>
        </div>
      </div>

      {error && <p className="error-text chat-error">{error}</p>}

      <div className="chat-messages">
        {isLoading ? (
          <EmptyState text="Loading messages..." />
        ) : messages.length === 0 ? (
          <EmptyState text="No messages yet" />
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.sender_id === currentUserId}
              onReply={setReplyTo}
              onDelete={handleDelete}
              onDeleteForEveryone={handleDeleteForEveryone}
              onReport={setReportMessage}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {typingLabel && <div className="typing-indicator">{typingLabel}</div>}

      {replyTo && (
        <div className="chat-reply-box">
          <span>
            Replying to {replyTo.sender_nickname}:{" "}
            {replyTo.content || replyTo.message_type}
          </span>
          <button type="button" onClick={() => setReplyTo(null)}>
            Clear
          </button>
        </div>
      )}

      {file && (
        <div className="chat-reply-box">
          <span>
            {attachmentType}: {file.name}
          </span>
          <button type="button" onClick={() => setFile(null)}>
            Clear
          </button>
        </div>
      )}

      <form className="chat-composer" onSubmit={handleSubmit}>
        <label className="chat-file-button">
          File
          <input type="file" onChange={handleFileChange} />
        </label>

        <Input
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            emitTyping();
          }}
          placeholder={file ? "Optional caption" : "Write a message"}
        />

        <Button type="submit" disabled={!file && !content.trim()}>
          Send
        </Button>
      </form>

      {reportMessage && (
        <ReportMessageModal
          onClose={() => setReportMessage(null)}
          onSubmit={handleReportMessage}
        />
      )}

      {isReportUserOpen && (
        <ReportMessageModal
          title={`Report ${conversation.other_user_nickname}`}
          onClose={() => setIsReportUserOpen(false)}
          onSubmit={handleReportUser}
        />
      )}
    </section>
  );
}
