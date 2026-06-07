import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "../../api/notificationsApi";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";
import { ConfirmModal } from "../ui/Modal";
import type { Notification } from "../../types/notification";

function getNotificationText(n: Notification) {
  if (n.type === "cocktail_approved") return "Your cocktail was approved";
  if (n.type === "cocktail_rejected") return "Your cocktail was rejected";
  if (n.type === "cocktail_like") return `${n.actor_nickname} liked your cocktail`;
  if (n.type === "cocktail_comment") return `${n.actor_nickname} commented on your cocktail`;
  if (n.type === "comment_like") return `${n.actor_nickname} liked your comment`;
  if (n.type === "comment_reply") return `${n.actor_nickname} replied to your comment`;
  if (n.type === "mention") return `${n.actor_nickname} mentioned you`;
  if (n.type === "report_public_cocktail_removed") return "Your cocktail was removed by admin";
  if (n.type === "report_comment_deleted") return "Your comment was deleted by admin";
  if (n.type === "report_rejected") return "Your report was rejected by admin";
  if (n.type === "role_changed") return "Your role was changed";
  if (n.type === "public_cocktail_deleted") return "Your public cocktail was deleted by admin";
  if (n.type === "admin_comment_deleted") return "Your comment was deleted by admin";
  if (n.type === "friend_request_received") return `${n.actor_nickname} sent you a friend request`;
  if (n.type === "friend_request_accepted") return `${n.actor_nickname} accepted your friend request`;
  if (n.type === "new_message") return `${n.actor_nickname} sent you a message`;
  if (n.type === "cocktail_shared") return `${n.actor_nickname} shared a cocktail with you`;
  if (n.type === "admin_warning") return "You received an admin warning";
  if (n.type === "chat_muted") return "You were temporarily muted in chat";
  if (n.type === "chat_banned") return "You were banned from chat";

  return n.type;
}

function getNotificationIcon(n: Notification) {
  if (n.type === "cocktail_approved") return "✅";
  if (n.type === "cocktail_rejected") return "❌";
  if (n.type === "cocktail_like" || n.type === "comment_like") return "❤️";
  if (n.type === "cocktail_comment" || n.type === "comment_reply") return "💬";
  if (n.type === "mention") return "👤";
  if (n.type.includes("report")) return "⚠️";
  if (n.type === "role_changed") return "🛡️";
  if (n.type === "public_cocktail_deleted" || n.type === "admin_comment_deleted") return "🗑️";
  if (n.type === "friend_request_received" || n.type === "friend_request_accepted") return "👥";
  if (n.type === "new_message" || n.type === "cocktail_shared") return "💬";
  if (n.type === "admin_warning" || n.type === "chat_muted" || n.type === "chat_banned") return "⚠️";

  return "🔔";
}

function getNotificationClassName(n: Notification) {
  if (n.is_read) return "notification-card notification-read";
  if (n.type === "cocktail_approved") return "notification-card notification-approved";
  if (n.type === "cocktail_rejected") return "notification-card notification-rejected";
  if (n.type.includes("report")) return "notification-card notification-report";
  if (n.type === "cocktail_like" || n.type === "comment_like") return "notification-card notification-like";
  if (n.type === "cocktail_comment" || n.type === "comment_reply") return "notification-card notification-comment";
  if (n.type === "mention") return "notification-card notification-mention";
  if (n.type === "public_cocktail_deleted" || n.type === "admin_comment_deleted") return "notification-card notification-rejected";
  if (n.type === "role_changed") return "notification-card notification-comment";
  if (n.type === "friend_request_received" || n.type === "friend_request_accepted") return "notification-card notification-comment";
  if (n.type === "new_message" || n.type === "cocktail_shared") return "notification-card notification-comment";
  if (n.type === "admin_warning" || n.type === "chat_muted" || n.type === "chat_banned") return "notification-card notification-report";

  return "notification-card notification-comment";
}

function getNotificationPath(n: Notification) {
  if (n.type === "cocktail_approved") return `/public-cocktails/${n.recipe_id}`;
  if (n.type === "cocktail_rejected") return `/my-cocktails/${n.recipe_id}`;

  if (n.comment_id) {
    if (n.recipe_type === "public") {
      return `/public-cocktails/${n.recipe_id}#comment-${n.comment_id}`;
    }

    if (n.recipe_type === "catalog") {
      return `/catalog/${n.recipe_id}#comment-${n.comment_id}`;
    }
  }

  if (n.recipe_type === "public") return `/public-cocktails/${n.recipe_id}`;
  if (n.recipe_type === "catalog") return `/catalog/${n.recipe_id}`;
  if (n.recipe_type === "user") return `/my-cocktails/${n.recipe_id}`;
  if (n.type === "friend_request_received" || n.type === "friend_request_accepted") return "/friends";
  if (n.type === "new_message" || n.type === "cocktail_shared") return "/chat";

  return null;
}

export default function NotificationsList() {
  const navigate = useNavigate();

  const [showClearModal, setShowClearModal] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");

      const data = await notificationsApi.getNotifications();
      setItems(data);
    } catch {
      setError("Failed to load notifications");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllAsRead();
    await load();
  };

  const handleClearAll = async () => {
    await notificationsApi.clearAll();
    setShowClearModal(false);
    await load();
  };

  if (error) {
    return <p className="error-text">{error}</p>;
  }

  return (
    <div className="notifications-panel">
      <div className="notifications-actions">
        <Button onClick={handleMarkAllRead}>Mark all as read</Button>

        <Button
          variant="danger"
          disabled={items.length === 0}
          onClick={() => setShowClearModal(true)}
        >
          Clear all
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState text="No notifications" />
      ) : (
        <div className="notifications-grid">
          {items.map((notification) => {
            const path = getNotificationPath(notification);

            return (
              <div
                key={notification.id}
                className={`${getNotificationClassName(notification)} ${
                  path ? "notification-clickable" : ""
                }`}
                onClick={async () => {
                  if (!notification.is_read) {
                    await notificationsApi.markAsRead(notification.id);
                  }

                  if (path) {
                    navigate(path);
                  }
                }}
              >
                <p className="notification-title">
                  <span className="notification-icon">
                    {getNotificationIcon(notification)}
                  </span>

                  {getNotificationText(notification)}
                </p>

                {notification.admin_reason && (
                  <p className="notification-reason">
                    <strong>Reason:</strong> {notification.admin_reason}
                  </p>
                )}

                <small className="notification-date">
                  {new Date(notification.created_at).toLocaleString("pl-PL")}
                </small>
              </div>
            );
          })}
        </div>
      )}

      {showClearModal && (
        <ConfirmModal
          title="Clear notifications"
          text="Are you sure you want to clear all notifications?"
          confirmText="Clear all"
          danger
          onConfirm={handleClearAll}
          onCancel={() => setShowClearModal(false)}
        />
      )}
    </div>
  );
}
