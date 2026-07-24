import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Copy,
  Download,
  FileText,
  Pencil,
  Flag,
  Forward,
  MoreVertical,
  Pause,
  Pin,
  PinOff,
  Play,
  Reply,
  Smile,
  Trash,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import type {
  ChatAttachmentMetadata,
  ChatMessage,
  CocktailShareMetadata,
  CommentShareMetadata,
} from "../../types/chat";
import { isEnabledFlag } from "../../utils/booleanFlag";
import { getImageUrl } from "../../utils/getImageUrl";
import UserAvatar from "../ui/UserAvatar";
import VoiceWaveform, {
  compactWaveformLevels,
  formatVoiceTime,
  getFallbackWaveformLevels,
} from "./VoiceWaveform";

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  onReply: (message: ChatMessage) => void;
  onDelete: (messageId: number) => Promise<void>;
  onDeleteForEveryone: (messageId: number) => Promise<void>;
  onReport: (message: ChatMessage) => void;
  onForward: (message: ChatMessage) => void;
  onCopy: (message: ChatMessage) => Promise<void>;
  onEdit: (message: ChatMessage) => void;
  onPin: (message: ChatMessage) => Promise<void>;
  onReact: (message: ChatMessage, emoji: string) => Promise<void>;
  onRemoveReaction: (message: ChatMessage) => Promise<void>;
}

const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "👍", "🔥"];

function isCocktailMetadata(metadata: ChatMessage["metadata"]): metadata is CocktailShareMetadata {
  return Boolean(metadata && "cocktailName" in metadata);
}

function isAttachmentMetadata(metadata: ChatMessage["metadata"]): metadata is ChatAttachmentMetadata {
  return Boolean(metadata && "fileUrl" in metadata);
}

function isCommentShareMetadata(
  metadata: ChatMessage["metadata"],
): metadata is CommentShareMetadata {
  return Boolean(
    metadata &&
      "sharedType" in metadata &&
      metadata.sharedType === "comment",
  );
}

function formatAttachmentSize(size?: number) {
  if (!size) {
    return "";
  }

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getAttachmentLabel(attachment: ChatAttachmentMetadata) {
  if (attachment.mimeType?.includes("pdf")) {
    return "PDF document";
  }

  if (attachment.mimeType?.includes("word")) {
    return "Word document";
  }

  if (attachment.mimeType?.includes("zip")) {
    return "ZIP archive";
  }

  if (attachment.mimeType?.startsWith("text/")) {
    return "Text file";
  }

  return attachment.mimeType || "File";
}

function getCocktailDetailsPath(cocktail: CocktailShareMetadata) {
  if (cocktail.cocktailType === "catalog") {
    return `/catalog/${cocktail.cocktailId}`;
  }

  if (cocktail.cocktailType === "public") {
    return `/public-cocktails/${cocktail.cocktailId}`;
  }

  return `/my-cocktails/${cocktail.cocktailId}`;
}

function VoiceMessage({ attachment }: { attachment: ChatAttachmentMetadata }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;
  const waveformLevels = compactWaveformLevels(
    attachment.waveformLevels?.length
      ? attachment.waveformLevels
      : getFallbackWaveformLevels(),
  );

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      await audio.play();
    } else {
      audio.pause();
    }
  };

  return (
    <div className="voice-message">
      <audio
        ref={audioRef}
        src={getImageUrl(attachment.fileUrl || "")}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />

      <button
        type="button"
        className="voice-play-button"
        onClick={togglePlayback}
        aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
      </button>

      <VoiceWaveform
        levels={waveformLevels}
        className="voice-waveform"
        barClassName="voice-wave-bar"
        playedRatio={progress}
      />

      <span className="voice-duration">
        {formatVoiceTime(isPlaying ? currentTime : duration || currentTime)}
      </span>
    </div>
  );
}

function SharePostLink({
  to,
  image,
  title,
  className = "",
}: {
  to: string;
  image?: string | null;
  title: string;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={`message-share-post ${className}`.trim()}
      title={`Open ${title}`}
    >
      {image ? (
        <img src={getImageUrl(image)} alt={title} />
      ) : (
        <span>{title}</span>
      )}
    </Link>
  );
}

function ShareNote({ content }: { content: string | null }) {
  if (!content) {
    return null;
  }

  return <p className="message-content message-share-note">{content}</p>;
}

function MessageReplyPreview({ message }: { message: ChatMessage }) {
  const repliedCocktail =
    message.reply_message_type === "cocktail_share" &&
    isCocktailMetadata(message.reply_metadata)
      ? message.reply_metadata
      : null;

  if (repliedCocktail) {
    return (
      <Link
        to={getCocktailDetailsPath(repliedCocktail)}
        className="message-reply-preview message-reply-cocktail"
        title={`Open ${repliedCocktail.cocktailName}`}
      >
        {repliedCocktail.cocktailImage ? (
          <img
            src={getImageUrl(repliedCocktail.cocktailImage)}
            alt={repliedCocktail.cocktailName}
          />
        ) : (
          <span className="message-reply-cocktail-placeholder" aria-hidden="true">
            {repliedCocktail.cocktailName.slice(0, 1)}
          </span>
        )}
        <span className="message-reply-cocktail-info">
          <strong>{repliedCocktail.cocktailName}</strong>
          <span>{repliedCocktail.cocktailType} cocktail</span>
        </span>
      </Link>
    );
  }

  return (
    <div className="message-reply-preview">
      {message.reply_message_type}: {message.reply_content || "Attachment"}
    </div>
  );
}

function FileAttachment({ attachment }: { attachment: ChatAttachmentMetadata }) {
  const fileUrl = getImageUrl(attachment.fileUrl || "");
  const fileSize = formatAttachmentSize(attachment.fileSize);

  return (
    <a
      className="message-file-card"
      href={fileUrl}
      target="_blank"
      rel="noreferrer"
      download={attachment.fileName}
    >
      <span className="message-file-icon">
        <FileText size={20} aria-hidden="true" />
      </span>
      <span className="message-file-info">
        <strong>{attachment.fileName || "Download file"}</strong>
        <span>
          {getAttachmentLabel(attachment)}
          {fileSize ? ` · ${fileSize}` : ""}
        </span>
      </span>
      <Download size={18} aria-hidden="true" />
    </a>
  );
}

function CommentSharePreview({
  commentShare,
}: {
  commentShare: CommentShareMetadata;
}) {
  const postPath =
    commentShare.postPath || commentShare.commentPath.split("#")[0];

  return (
    <div className="message-share-preview message-share-preview-comment">
      <SharePostLink
        to={postPath}
        image={commentShare.postImage}
        title={commentShare.postTitle || "Shared post"}
        className="message-share-post-source"
      />

      <Link
        to={commentShare.commentPath}
        className="message-share-card"
        title="Open shared comment"
      >
        <UserAvatar
          nickname={commentShare.commentAuthorNickname}
          avatar={commentShare.commentAuthorAvatar}
          className="message-share-avatar"
        />
        <span className="message-share-body">
          <strong>{commentShare.commentAuthorNickname}</strong>{" "}
          <span>{commentShare.commentContent}</span>
        </span>
      </Link>
    </div>
  );
}

function CocktailSharePreview({
  cocktail,
}: {
  cocktail: CocktailShareMetadata;
}) {
  const cocktailPath = getCocktailDetailsPath(cocktail);

  return (
    <div className="message-share-preview">
      {cocktail.cocktailType === "public" &&
        cocktail.authorId &&
        cocktail.authorNickname && (
          <Link
            to={`/authors/${cocktail.authorId}`}
            className="message-share-author"
            title="Open author profile"
          >
            <UserAvatar
              nickname={cocktail.authorNickname}
              avatar={cocktail.authorAvatar}
              className="message-share-author-avatar"
            />
            <strong>{cocktail.authorNickname}</strong>
          </Link>
        )}

      <SharePostLink
        to={cocktailPath}
        image={cocktail.cocktailImage}
        title={cocktail.cocktailName}
      />

      <Link
        to={cocktailPath}
        className="message-share-card message-share-card-cocktail"
        title="Open cocktail"
      >
        <span className="message-share-body">
          <strong>{cocktail.cocktailName}</strong>
          <span>{cocktail.cocktailType} cocktail</span>
        </span>
      </Link>
    </div>
  );
}

export default function MessageBubble({
  message,
  isOwn,
  onReply,
  onDelete,
  onDeleteForEveryone,
  onReport,
  onForward,
  onCopy,
  onEdit,
  onPin,
  onReact,
  onRemoveReaction,
}: MessageBubbleProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const moreButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const updateMenuPosition = () => {
    const trigger = moreButtonRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    const viewportPadding = 12;
    const gap = 8;
    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const fitsAbove =
      triggerRect.top - menuRect.height - gap >= viewportPadding;
    const top = fitsAbove
      ? triggerRect.top - menuRect.height - gap
      : Math.min(
          triggerRect.bottom + gap,
          window.innerHeight - menuRect.height - viewportPadding,
        );
    const preferredLeft = isOwn
      ? triggerRect.right - menuRect.width
      : triggerRect.left;
    const left = Math.min(
      Math.max(viewportPadding, preferredLeft),
      window.innerWidth - menuRect.width - viewportPadding,
    );

    setMenuPosition({
      top: Math.max(viewportPadding, top),
      left,
    });
  };

  useLayoutEffect(() => {
    if (!isMenuOpen) {
      setMenuPosition(null);
      return;
    }

    updateMenuPosition();
  }, [isMenuOpen, isOwn]);

  useEffect(() => {
    if (!isMenuOpen && !isReactionPickerOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        toolbarRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setIsMenuOpen(false);
      setIsReactionPickerOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsReactionPickerOpen(false);
      }
    };
    const handleViewportChange = () => {
      setIsMenuOpen(false);
      setIsReactionPickerOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isMenuOpen, isReactionPickerOpen]);

  if (message.deleted_at) {
    return null;
  }

  const attachment = isAttachmentMetadata(message.metadata)
    ? message.metadata
    : null;
  const cocktail = isCocktailMetadata(message.metadata) ? message.metadata : null;
  const commentShare = isCommentShareMetadata(message.metadata)
    ? message.metadata
    : null;
  const isPinned = isEnabledFlag(message.is_pinned);
  const canEdit =
    isOwn &&
    message.message_type === "text" &&
    !commentShare &&
    !cocktail &&
    !attachment;
  const forwardedNickname =
    message.metadata && "forwardedFromNickname" in message.metadata
      ? message.metadata.forwardedFromNickname
      : null;

  const runAction = async (action: () => Promise<void> | void) => {
    setIsMenuOpen(false);
    setIsReactionPickerOpen(false);
    await action();
  };

  const messageToolbar = (
    <div
      ref={toolbarRef}
      className={`message-toolbar ${
        isMenuOpen || isReactionPickerOpen ? "message-toolbar-open" : ""
      }`}
    >
      <button
        type="button"
        title="React"
        aria-label="React"
        onClick={() => {
          setIsMenuOpen(false);
          setIsReactionPickerOpen((open) => !open);
        }}
      >
        <Smile size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        title="Reply"
        aria-label="Reply"
        onClick={() => onReply(message)}
      >
        <Reply size={16} aria-hidden="true" />
      </button>
      <button
        ref={moreButtonRef}
        type="button"
        title="More"
        aria-label="More"
        aria-expanded={isMenuOpen}
        onClick={() => {
          setIsReactionPickerOpen(false);
          setIsMenuOpen((open) => !open);
        }}
      >
        <MoreVertical size={16} aria-hidden="true" />
      </button>

      {isReactionPickerOpen && (
        <div
          className={`message-emoji-popover ${
            isOwn ? "message-emoji-popover-own" : ""
          }`}
        >
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => runAction(() => onReact(message, emoji))}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {isMenuOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="message-menu-popover message-menu-popover-floating"
            style={{
              top: menuPosition?.top ?? 0,
              left: menuPosition?.left ?? 0,
              visibility: menuPosition ? "visible" : "hidden",
            }}
            role="menu"
          >
          <span className="message-menu-date">
            {new Date(message.created_at).toLocaleString("pl-PL")}
          </span>
          <button type="button" onClick={() => runAction(() => onForward(message))}>
            <span>Forward</span>
            <Forward size={17} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => runAction(() => onCopy(message))}>
            <span>Copy</span>
            <Copy size={17} aria-hidden="true" />
          </button>
          {canEdit && (
            <button type="button" onClick={() => runAction(() => onEdit(message))}>
              <span>Edit</span>
              <Pencil size={17} aria-hidden="true" />
            </button>
          )}
          <button type="button" onClick={() => runAction(() => onPin(message))}>
            <span>{isPinned ? "Unpin" : "Pin"}</span>
            {isPinned ? (
              <PinOff size={17} aria-hidden="true" />
            ) : (
              <Pin size={17} aria-hidden="true" />
            )}
          </button>
          {!isOwn && (
            <button type="button" onClick={() => runAction(() => onReport(message))}>
              <span>Report</span>
              <Flag size={17} aria-hidden="true" />
            </button>
          )}
          <button type="button" onClick={() => runAction(() => onDelete(message.id))}>
            <span>Delete for me</span>
            <Trash size={17} aria-hidden="true" />
          </button>
          {isOwn && (
            <button
              type="button"
              className="message-menu-danger"
              onClick={() => runAction(() => onDeleteForEveryone(message.id))}
            >
              <span>Delete for everyone</span>
              <Trash2 size={17} aria-hidden="true" />
            </button>
          )}
          </div>,
          document.body,
        )}
    </div>
  );

  return (
    <div className={`message-row ${isOwn ? "message-row-own" : ""}`}>
      {isOwn && messageToolbar}

      {!isOwn && (
        <UserAvatar
          nickname={message.sender_nickname}
          avatar={message.sender_avatar}
          className="message-avatar"
        />
      )}

      <div
        className={`message-bubble ${isOwn ? "message-bubble-own" : ""} ${
          commentShare || cocktail ? "message-bubble-share" : ""
        } ${attachment ? "message-bubble-attachment" : ""}`}
      >
        {forwardedNickname && (
          <p className="message-forwarded">Forwarded from {forwardedNickname}</p>
        )}

        {message.reply_to_message_id && (
          <MessageReplyPreview message={message} />
        )}

        {message.message_type === "text" && !commentShare && (
          <p className="message-content">{message.content}</p>
        )}

        {commentShare && (
          <>
            <CommentSharePreview commentShare={commentShare} />
            <ShareNote content={message.content} />
          </>
        )}

        {cocktail && (
          <>
            <CocktailSharePreview cocktail={cocktail} />
            <ShareNote content={message.content} />
          </>
        )}

        {attachment && message.message_type === "image" && (
          <div className="message-attachment">
            <img src={getImageUrl(attachment.fileUrl)} alt={attachment.fileName} />
            {message.content && <p>{message.content}</p>}
          </div>
        )}

        {attachment && message.message_type === "video" && (
          <div className="message-attachment message-video-attachment">
            <video
              src={getImageUrl(attachment.fileUrl)}
              controls
              preload="metadata"
            />
            {message.content && <p>{message.content}</p>}
          </div>
        )}

        {attachment && message.message_type === "voice" && (
          <VoiceMessage attachment={attachment} />
        )}

        {attachment && message.message_type === "file" && (
          <FileAttachment attachment={attachment} />
        )}

        {isPinned && (
          <div className="message-meta">
            <span
              className="message-pin-label"
              title="Pinned"
              aria-label="Pinned"
            >
              <Pin size={14} aria-hidden="true" />
            </span>
          </div>
        )}

        {isEnabledFlag(message.is_edited) && (
          <span className="message-edited-label">Edited</span>
        )}

        {message.reactions && message.reactions.length > 0 && (
          <div className="message-reactions">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                type="button"
                className={`message-reaction ${
                  reaction.reactedByMe ? "message-reaction-own" : ""
                }`}
                onClick={() =>
                  reaction.reactedByMe
                    ? onRemoveReaction(message)
                    : onReact(message, reaction.emoji)
                }
              >
                {reaction.emoji} {reaction.count}
              </button>
            ))}
          </div>
        )}
      </div>

      {!isOwn && messageToolbar}
    </div>
  );
}
