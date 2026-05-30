import { useState } from "react";
import {
  Mail,
  MailOpen,
  MoreVertical,
  Pin,
  PinOff,
  Trash,
  Trash2,
} from "lucide-react";
import type { ConversationListItem } from "../../types/chat";
import EmptyState from "../ui/EmptyState";
import OnlineBadge from "./OnlineBadge";

interface ChatSidebarProps {
  conversations: ConversationListItem[];
  activeConversationId: number | null;
  onSelect: (conversationId: number) => void;
  onTogglePin: (conversation: ConversationListItem) => Promise<void>;
  onToggleRead: (conversation: ConversationListItem) => Promise<void>;
  onDeleteForMe: (conversationId: number) => Promise<void>;
  onDeleteForEveryone: (conversationId: number) => Promise<void>;
}

function getConversationPreview(conversation: ConversationListItem) {
  if (!conversation.last_message_id) return "No messages yet";
  if (conversation.last_message_type === "cocktail_share") return "Cocktail shared";
  if (conversation.last_message_type === "image") return "Image";
  if (conversation.last_message_type === "voice") return "Voice message";
  if (conversation.last_message_type === "file") return "File";
  return conversation.last_message_content || "Message";
}

export default function ChatSidebar({
  conversations,
  activeConversationId,
  onSelect,
  onTogglePin,
  onToggleRead,
  onDeleteForMe,
  onDeleteForEveryone,
}: ChatSidebarProps) {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const runMenuAction = async (
    action: () => Promise<void>,
  ) => {
    setOpenMenuId(null);
    await action();
  };

  return (
    <aside className="chat-sidebar">
      <div className="chat-sidebar-header">
        <h2>Chats</h2>
      </div>

      {conversations.length === 0 ? (
        <EmptyState text="No chats yet. Open a chat from your friends list later." />
      ) : (
        <div className="chat-conversation-list">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`chat-conversation-item ${
                conversation.id === activeConversationId
                  ? "chat-conversation-active"
                  : ""
              }`}
            >
              <button
                className="chat-conversation-select"
                onClick={() => onSelect(conversation.id)}
              >
                <span className="chat-avatar" aria-hidden="true">
                  {conversation.other_user_nickname.charAt(0).toUpperCase()}
                </span>

                <span className="chat-conversation-main">
                  <span className="chat-conversation-title-row">
                    <strong>
                      {conversation.is_pinned && (
                        <Pin
                          className="chat-title-pin"
                          size={14}
                          aria-label="Pinned"
                        />
                      )}
                      {conversation.other_user_nickname}
                    </strong>
                    {conversation.unread_count > 0 && (
                      <span className="chat-unread-badge">
                        {conversation.unread_count}
                      </span>
                    )}
                  </span>

                  <span className="chat-conversation-preview">
                    {getConversationPreview(conversation)}
                  </span>

                  <OnlineBadge
                    isOnline={conversation.is_online}
                    lastSeenAt={conversation.last_seen_at}
                  />
                </span>
              </button>

              <div className="chat-conversation-menu">
                <button
                  className="chat-menu-trigger"
                  aria-label="Conversation actions"
                  onClick={() =>
                    setOpenMenuId(
                      openMenuId === conversation.id ? null : conversation.id,
                    )
                  }
                >
                  <MoreVertical size={18} strokeWidth={2.2} aria-hidden="true" />
                </button>

                {openMenuId === conversation.id && (
                  <div className="chat-menu-popover">
                    <button
                      title={conversation.is_pinned ? "Unpin chat" : "Pin chat"}
                      onClick={() =>
                        runMenuAction(() =>
                          onTogglePin(conversation),
                        )
                      }
                    >
                      {conversation.is_pinned ? (
                        <PinOff size={17} aria-hidden="true" />
                      ) : (
                        <Pin size={17} aria-hidden="true" />
                      )}
                      <span>{conversation.is_pinned ? "Unpin" : "Pin"}</span>
                    </button>
                    <button
                      title={
                        conversation.unread_count > 0
                          ? "Mark as read"
                          : "Mark as unread"
                      }
                      onClick={() =>
                        runMenuAction(() =>
                          onToggleRead(conversation),
                        )
                      }
                    >
                      {conversation.unread_count > 0 ? (
                        <MailOpen size={17} aria-hidden="true" />
                      ) : (
                        <Mail size={17} aria-hidden="true" />
                      )}
                      <span>
                        {conversation.unread_count > 0
                          ? "Mark as read"
                          : "Mark as unread"}
                      </span>
                    </button>
                    <button
                      title="Delete for me"
                      onClick={() =>
                        runMenuAction(() =>
                          onDeleteForMe(conversation.id),
                        )
                      }
                    >
                      <Trash size={17} aria-hidden="true" />
                      <span>Delete for me</span>
                    </button>
                    <button
                      className="chat-menu-danger"
                      title="Delete for everyone"
                      onClick={() =>
                        runMenuAction(() =>
                          onDeleteForEveryone(conversation.id),
                        )
                      }
                    >
                      <Trash2 size={17} aria-hidden="true" />
                      <span>Delete for everyone</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
