import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  ArrowLeft,
  GlassWater,
  Mic,
  Paperclip,
  Pin,
  Smile,
  Square,
  Trash2,
  X,
} from "lucide-react";
import type { Socket } from "socket.io-client";
import { chatApi } from "../../api/chatApi";
import { chatReportsApi } from "../../api/chatReportsApi";
import type {
  ChatCocktailType,
  ChatMessage,
  ConversationListItem,
} from "../../types/chat";
import type { ChatReportReason } from "../../types/chatReport";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import MessageBubble from "./MessageBubble";
import OnlineBadge from "./OnlineBadge";
import ReportMessageModal from "./ReportMessageModal";
import ShareCocktailModal from "./ShareCocktailModal";
import VoiceWaveform, {
  createEmptyWaveformLevels,
  formatVoiceTime,
} from "./VoiceWaveform";

interface ChatWindowProps {
  conversation: ConversationListItem | null;
  conversations: ConversationListItem[];
  currentUserId: number;
  messages: ChatMessage[];
  isLoading: boolean;
  socket: Socket | null;
  isSocketConnected: boolean;
  typingLabel: string;
  onBack?: () => void;
  onMessagesChanged: () => Promise<void>;
}

const QUICK_MESSAGE_EMOJIS = ["😀", "😂", "❤️", "👍", "🔥", "👏"];

function getDateKey(value: string) {
  return new Date(value).toLocaleDateString("pl-PL");
}

function formatDateDivider(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (first: Date, second: Date) =>
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();

  const time = date.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isSameDay(date, today)) {
    return time;
  }

  if (isSameDay(date, yesterday)) {
    return `Yesterday, ${time}`;
  }

  return date.toLocaleString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSeenAgo(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `Seen ${diffMinutes} min. ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  return `Seen ${diffHours} h. ago`;
}

function getPinnedMessagePreview(message: ChatMessage) {
  if (message.message_type === "cocktail_share") {
    const cocktailName =
      message.metadata && "cocktailName" in message.metadata
        ? message.metadata.cocktailName
        : "Cocktail";

    return `Cocktail: ${cocktailName}`;
  }

  if (message.message_type === "image") return message.content || "Image";
  if (message.message_type === "voice") return "Voice message";
  if (message.message_type === "file") {
    const fileName =
      message.metadata && "fileName" in message.metadata
        ? message.metadata.fileName
        : "File";

    return fileName || "File";
  }

  return message.content || "Message";
}

export default function ChatWindow({
  conversation,
  conversations,
  currentUserId,
  messages,
  isLoading,
  socket,
  isSocketConnected,
  typingLabel,
  onBack,
  onMessagesChanged,
}: ChatWindowProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [reportMessage, setReportMessage] = useState<ChatMessage | null>(null);
  const [forwardMessage, setForwardMessage] = useState<ChatMessage | null>(null);
  const [isReportUserOpen, setIsReportUserOpen] = useState(false);
  const [isShareCocktailOpen, setIsShareCocktailOpen] = useState(false);
  const [isComposerEmojiOpen, setIsComposerEmojiOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [attachmentType, setAttachmentType] = useState<"image" | "file" | "voice">("file");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingLevels, setRecordingLevels] = useState<number[]>(
    createEmptyWaveformLevels(),
  );
  const [draftVoiceDuration, setDraftVoiceDuration] = useState(0);
  const [draftVoiceLevels, setDraftVoiceLevels] = useState<number[]>(
    createEmptyWaveformLevels(),
  );
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recordingAnimationRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingStartedAtRef = useRef<number>(0);
  const lastWaveformUpdateRef = useRef(0);
  const recordingLevelsRef = useRef<number[]>(
    createEmptyWaveformLevels(),
  );

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

  const startVoiceRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Voice recording is not supported in this browser.");
      return;
    }

    setError("");
    setFile(null);
    setDraftVoiceDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 128;
      const data = new Uint8Array(analyser.fftSize);
      source.connect(analyser);

      audioChunksRef.current = [];
      mediaRecorderRef.current = recorder;
      audioContextRef.current = audioContext;
      recordingStartedAtRef.current = Date.now();
      setRecordingSeconds(0);
      const emptyLevels = createEmptyWaveformLevels();
      setRecordingLevels(emptyLevels);
      recordingLevelsRef.current = emptyLevels;

      const tickWaveform = () => {
        const now = performance.now();

        analyser.getByteTimeDomainData(data);

        const rms = Math.sqrt(
          data.reduce((sum, value) => {
            const centeredValue = (value - 128) / 128;
            return sum + centeredValue * centeredValue;
          }, 0) / Math.max(data.length, 1),
        );

        const noiseGate = 0.006;
        const level =
          rms < noiseGate ? 0 : Math.min(1, Math.max(0.16, (rms - noiseGate) * 18));

        if (now - lastWaveformUpdateRef.current > 95) {
          lastWaveformUpdateRef.current = now;
          setRecordingLevels((levels) => {
            const nextLevels = [...levels.slice(1), level];
            recordingLevelsRef.current = nextLevels;
            return nextLevels;
          });
        }

        recordingAnimationRef.current = window.requestAnimationFrame(tickWaveform);
      };

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const voiceFile = new File([blob], `voice-${Date.now()}.webm`, {
          type: "audio/webm",
        });

        setFile(voiceFile);
        setAttachmentType("voice");
        setDraftVoiceDuration(
          Math.max(1, Math.ceil((Date.now() - recordingStartedAtRef.current) / 1000)),
        );
        setDraftVoiceLevels(recordingLevelsRef.current);
        setIsRecording(false);
        setRecordingSeconds(0);
        stream.getTracks().forEach((track) => track.stop());
        audioContext.close();
        audioContextRef.current = null;
        if (recordingAnimationRef.current) {
          window.cancelAnimationFrame(recordingAnimationRef.current);
          recordingAnimationRef.current = null;
        }
        if (recordingTimerRef.current) {
          window.clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };

      recorder.start();
      setIsRecording(true);
      tickWaveform();
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((seconds) => seconds + 1);
      }, 1000);
    } catch {
      setError("Microphone permission is required to record voice messages.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  useEffect(() => {
    return () => {
      if (recordingAnimationRef.current) {
        window.cancelAnimationFrame(recordingAnimationRef.current);
      }
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
      }
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      audioContextRef.current?.close();
    };
  }, []);

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
          attachmentType === "voice" ? draftVoiceDuration : null,
          attachmentType === "voice" ? draftVoiceLevels : null,
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
      setDraftVoiceDuration(0);
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

  const refreshMessagesAfterUpdate = async () => {
    setError("");
    await onMessagesChanged();
  };

  const handleCopyMessage = async (message: ChatMessage) => {
    const metadata = message.metadata;
    const fileUrl =
      metadata && "fileUrl" in metadata && metadata.fileUrl
        ? metadata.fileUrl
        : "";
    const cocktailName =
      metadata && "cocktailName" in metadata ? metadata.cocktailName : "";
    const copyValue = message.content || cocktailName || fileUrl;

    if (!copyValue) {
      setError("Nothing to copy.");
      return;
    }

    await navigator.clipboard.writeText(copyValue);
  };

  const handlePinMessage = async (message: ChatMessage) => {
    message.is_pinned
      ? await chatApi.unpinMessage(message.id)
      : await chatApi.pinMessage(message.id);

    await refreshMessagesAfterUpdate();
  };

  const handleReactMessage = async (message: ChatMessage, emoji: string) => {
    const ownReaction = message.reactions?.find(
      (reaction) => reaction.reactedByMe && reaction.emoji === emoji,
    );
    ownReaction
      ? await chatApi.removeMessageReaction(message.id)
      : await chatApi.setMessageReaction(message.id, emoji);

    await refreshMessagesAfterUpdate();
  };

  const handleRemoveReaction = async (message: ChatMessage) => {
    await chatApi.removeMessageReaction(message.id);
    await refreshMessagesAfterUpdate();
  };

  const handleForwardMessage = async (targetConversationId: number) => {
    if (!forwardMessage) return;

    await chatApi.forwardMessage(forwardMessage.id, targetConversationId);
    setForwardMessage(null);
    await onMessagesChanged();
  };

  const handleShareCocktail = async (
    cocktailId: string,
    cocktailType: ChatCocktailType,
  ) => {
    if (!conversation) return;

    await chatApi.sendCocktailShare(
      conversation.id,
      cocktailId,
      cocktailType,
      replyTo?.id ?? null,
    );
    setReplyTo(null);
    await onMessagesChanged();
  };

  const clearAttachment = () => {
    setFile(null);
    setDraftVoiceDuration(0);
    setDraftVoiceLevels(createEmptyWaveformLevels());
  };

  const lastMessage = messages[messages.length - 1] ?? null;
  const pinnedMessages = messages.filter(
    (message) => message.is_pinned && !message.deleted_at,
  );
  const pinnedMessage = pinnedMessages[pinnedMessages.length - 1] ?? null;
  const lastReadOwnMessage =
    lastMessage?.sender_id === currentUserId && lastMessage.is_read_by_recipient
      ? lastMessage
      : null;

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
        {onBack && (
          <button
            type="button"
            className="chat-mobile-back"
            onClick={onBack}
            aria-label="Back to chats"
            title="Back to chats"
          >
            <ArrowLeft size={19} aria-hidden="true" />
          </button>
        )}

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

      {pinnedMessage && (
        <div className="chat-pinned-panel">
          <button
            type="button"
            className="chat-pinned-content"
            onClick={() =>
              document
                .getElementById(`chat-message-${pinnedMessage.id}`)
                ?.scrollIntoView({ behavior: "smooth", block: "center" })
            }
          >
            <span className="chat-pinned-icon" aria-hidden="true">
              <Pin size={16} />
            </span>
            <span className="chat-pinned-text">
              <strong>
                Pinned message
                {pinnedMessages.length > 1 ? ` ${pinnedMessages.length}` : ""}
              </strong>
              <span>
                {pinnedMessage.sender_nickname}:{" "}
                {getPinnedMessagePreview(pinnedMessage)}
              </span>
            </span>
          </button>

          <button
            type="button"
            className="chat-pinned-unpin"
            onClick={() => handlePinMessage(pinnedMessage)}
            title="Unpin message"
            aria-label="Unpin message"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="chat-messages">
        {isLoading ? (
          <EmptyState text="Loading messages..." />
        ) : messages.length === 0 ? (
          <EmptyState text="No messages yet" />
        ) : (
          messages.map((message, index) => {
            const previousMessage = messages[index - 1];
            const shouldShowDateDivider =
              !previousMessage ||
              getDateKey(previousMessage.created_at) !==
                getDateKey(message.created_at);

            return (
              <div
                key={message.id}
                id={`chat-message-${message.id}`}
                className="message-stack-item"
              >
                {shouldShowDateDivider && (
                  <div className="message-date-divider">
                    {formatDateDivider(message.created_at)}
                  </div>
                )}
                <MessageBubble
                  message={message}
                  isOwn={message.sender_id === currentUserId}
                  onReply={setReplyTo}
                  onDelete={handleDelete}
                  onDeleteForEveryone={handleDeleteForEveryone}
                  onReport={setReportMessage}
                  onForward={setForwardMessage}
                  onCopy={handleCopyMessage}
                  onPin={handlePinMessage}
                  onReact={handleReactMessage}
                  onRemoveReaction={handleRemoveReaction}
                />
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {lastReadOwnMessage && (
        <div className="chat-read-receipt">
          {formatSeenAgo(lastReadOwnMessage.created_at)}
        </div>
      )}

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
        attachmentType === "voice" ? (
          <div className="voice-draft-panel">
            <VoiceWaveform
              levels={draftVoiceLevels}
              className="voice-draft-wave"
              barClassName="voice-recording-bar"
            />
            <span className="voice-draft-time">
              {formatVoiceTime(draftVoiceDuration)}
            </span>
            <button
              type="button"
              onClick={clearAttachment}
              title="Remove voice message"
              aria-label="Remove voice message"
            >
              <Trash2 size={17} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="chat-reply-box">
            <span>
              {attachmentType}: {file.name}
            </span>
            <button type="button" onClick={clearAttachment}>
              Clear
            </button>
          </div>
        )
      )}

      {isRecording && (
        <div className="voice-recording-panel">
          <span className="voice-recording-dot" aria-hidden="true" />
          <span className="voice-recording-time">
            {formatVoiceTime(recordingSeconds)}
          </span>
          <VoiceWaveform
            levels={recordingLevels}
            className="voice-recording-wave"
            barClassName="voice-recording-bar"
          />
          <Button
            type="button"
            variant="danger"
            className="chat-composer-icon-button"
            onClick={stopVoiceRecording}
            title="Stop recording"
            aria-label="Stop recording"
          >
            <Square size={17} aria-hidden="true" />
          </Button>
        </div>
      )}

      <form className="chat-composer" onSubmit={handleSubmit}>
        <Button
          type="button"
          variant="secondary"
          className="chat-composer-icon-button"
          onClick={() => setIsShareCocktailOpen(true)}
          title="Share cocktail"
          aria-label="Share cocktail"
        >
          <GlassWater size={18} aria-hidden="true" />
        </Button>

        <label className="chat-file-button">
          <Paperclip size={18} aria-hidden="true" />
          <span className="sr-only">Attach file</span>
          <input type="file" onChange={handleFileChange} />
        </label>

        <div className="chat-composer-emoji-wrap">
          <Button
            type="button"
            variant="secondary"
            className="chat-composer-icon-button"
            onClick={() => setIsComposerEmojiOpen((open) => !open)}
            title="Add emoji"
            aria-label="Add emoji"
          >
            <Smile size={18} aria-hidden="true" />
          </Button>

          {isComposerEmojiOpen && (
            <div className="chat-composer-emoji-popover">
              {QUICK_MESSAGE_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setContent((value) => `${value}${emoji}`);
                    setIsComposerEmojiOpen(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          type="button"
          variant={isRecording ? "danger" : "secondary"}
          className="chat-composer-icon-button"
          onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
          title={isRecording ? "Stop recording" : "Record voice message"}
          aria-label={isRecording ? "Stop recording" : "Record voice message"}
        >
          {isRecording ? (
            <Square size={17} aria-hidden="true" />
          ) : (
            <Mic size={18} aria-hidden="true" />
          )}
        </Button>

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

      {isShareCocktailOpen && (
        <ShareCocktailModal
          onClose={() => setIsShareCocktailOpen(false)}
          onShare={handleShareCocktail}
        />
      )}

      {forwardMessage && (
        <Modal
          title="Forward message"
          onClose={() => setForwardMessage(null)}
          footer={
            <Button variant="secondary" onClick={() => setForwardMessage(null)}>
              Cancel
            </Button>
          }
        >
          <div className="forward-chat-list">
            {conversations.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleForwardMessage(item.id)}
              >
                <span className="chat-avatar" aria-hidden="true">
                  {item.other_user_nickname.charAt(0).toUpperCase()}
                </span>
                <span>{item.other_user_nickname}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </section>
  );
}
