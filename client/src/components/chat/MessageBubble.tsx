import type { ChatAttachmentMetadata, ChatMessage, CocktailShareMetadata } from "../../types/chat";
import { getImageUrl } from "../../utils/getImageUrl";
import Button from "../ui/Button";

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  onReply: (message: ChatMessage) => void;
  onDelete: (messageId: number) => Promise<void>;
  onDeleteForEveryone: (messageId: number) => Promise<void>;
  onReport: (message: ChatMessage) => void;
}

function isCocktailMetadata(metadata: ChatMessage["metadata"]): metadata is CocktailShareMetadata {
  return Boolean(metadata && "cocktailName" in metadata);
}

function isAttachmentMetadata(metadata: ChatMessage["metadata"]): metadata is ChatAttachmentMetadata {
  return Boolean(metadata && "fileUrl" in metadata);
}

export default function MessageBubble({
  message,
  isOwn,
  onReply,
  onDelete,
  onDeleteForEveryone,
  onReport,
}: MessageBubbleProps) {
  if (message.deleted_at) {
    return null;
  }

  const attachment = isAttachmentMetadata(message.metadata)
    ? message.metadata
    : null;
  const cocktail = isCocktailMetadata(message.metadata) ? message.metadata : null;

  return (
    <div className={`message-row ${isOwn ? "message-row-own" : ""}`}>
      <div className={`message-bubble ${isOwn ? "message-bubble-own" : ""}`}>
        {!isOwn && <p className="message-author">{message.sender_nickname}</p>}

        {message.reply_to_message_id && (
          <div className="message-reply-preview">
            {message.reply_message_type}: {message.reply_content || "Attachment"}
          </div>
        )}

        {message.message_type === "text" && (
          <p className="message-content">{message.content}</p>
        )}

        {cocktail && (
          <div className="message-cocktail-card">
            {cocktail.cocktailImage && (
              <img
                src={getImageUrl(cocktail.cocktailImage)}
                alt={cocktail.cocktailName}
              />
            )}
            <div>
              <strong>{cocktail.cocktailName}</strong>
              <p>{cocktail.cocktailType} cocktail</p>
            </div>
          </div>
        )}

        {attachment && message.message_type === "image" && (
          <div className="message-attachment">
            <img src={getImageUrl(attachment.fileUrl)} alt={attachment.fileName} />
            {message.content && <p>{message.content}</p>}
          </div>
        )}

        {attachment && message.message_type === "voice" && (
          <div className="message-attachment">
            <audio controls src={getImageUrl(attachment.fileUrl)} />
            <p>{attachment.fileName}</p>
          </div>
        )}

        {attachment && message.message_type === "file" && (
          <a
            className="message-file-link"
            href={getImageUrl(attachment.fileUrl)}
            target="_blank"
            rel="noreferrer"
          >
            {attachment.fileName || "Download file"}
          </a>
        )}

        <div className="message-meta">
          <span>{new Date(message.created_at).toLocaleString("pl-PL")}</span>
        </div>

        <div className="message-actions">
          <Button variant="secondary" onClick={() => onReply(message)}>
            Reply
          </Button>
          <Button variant="danger" onClick={() => onDelete(message.id)}>
            Delete for me
          </Button>
          {isOwn && (
            <Button
              variant="danger"
              onClick={() => onDeleteForEveryone(message.id)}
            >
              Delete for everyone
            </Button>
          )}
          {!isOwn && (
            <Button variant="warning" onClick={() => onReport(message)}>
              Report
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
