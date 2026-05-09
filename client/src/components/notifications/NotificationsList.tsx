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

  return "🔔";
}

function getNotificationBackground(n: Notification) {
  if (n.is_read) return "#f3f4f6";
  if (n.type === "cocktail_approved") return "#dcfce7";
  if (n.type === "cocktail_rejected") return "#fee2e2";
  if (n.type.includes("report")) return "#fef3c7";
  if (n.type === "cocktail_like" || n.type === "comment_like") return "#ffe4e6";
  if (n.type === "cocktail_comment" || n.type === "comment_reply") return "#dbeafe";
  if (n.type === "mention") return "#ede9fe";
  if (n.type === "public_cocktail_deleted" || n.type === "admin_comment_deleted") return "#fee2e2";
  if (n.type === "role_changed") return "#dbeafe";

  return "#dbeafe";
}

function getNotificationPath(n: Notification) {
  if (n.type === "cocktail_approved") return `/public-cocktails/${n.recipe_id}`;
  if (n.type === "cocktail_rejected") return `/my-cocktails/${n.recipe_id}`;
  if (n.comment_id) {
    if (n.recipe_type === "public") {
      return `/public-cocktails/${n.recipe_id}#comment-${n.comment_id}`;
    }
    if (n.recipe_type === "catalog")
      return `/catalog/${n.recipe_id}#comment-${n.comment_id}`;
  }
  if (n.recipe_type === "public") return `/public-cocktails/${n.recipe_id}`;
  if (n.recipe_type === "catalog") return `/catalog/${n.recipe_id}`;
  if (n.recipe_type === "user") return `/my-cocktails/${n.recipe_id}`;

  return null;
}

export default function NotificationsList() {
  const navigate = useNavigate();

  const [showClearModal, setShowClearModal] = useState(false);

  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
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
    return <p className="text-danger">{error}</p>;
  }

  return (
    <div className="page-container">
      <div className="actions-row">
        <Button onClick={handleMarkAllRead}>Mark all as read</Button>

        <Button variant="danger" disabled={items.length === 0} onClick={() => setShowClearModal(true)}>
          Clear all
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState text="No notifications" />
      ) : (
        <div className="notifications-grid">
          {items.map((n) => {
            const path = getNotificationPath(n);

            return (
              <div
                key={n.id}
                className="notification-card"
                onClick={async () => {
                  if (!n.is_read) {
                    await notificationsApi.markAsRead(n.id);
                  }

                  if (path) {
                    navigate(path);
                  }
                }}
                style={{
                  background: getNotificationBackground(n),
                  cursor: path ? "pointer" : "default",
                }}
              >
                <p className="notification-title">
                  <span className="notification-icon">
                    {getNotificationIcon(n)}
                  </span>

                  {getNotificationText(n)}
                </p>

                {n.admin_reason && (
                  <p className="notification-reason">
                    <strong>Reason:</strong> {n.admin_reason}
                  </p>
                )}

                <small className="notification-date">
                  {new Date(n.created_at).toLocaleString("pl-PL")}
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
