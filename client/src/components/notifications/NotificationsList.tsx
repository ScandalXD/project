import { useEffect, useState } from "react";
import { notificationsApi } from "../../api/notificationsApi";
import type { Notification } from "../../types/notification";

function getNotificationText(n: Notification) {
  if (n.type === "cocktail_like") {
    return `${n.actor_nickname} liked your cocktail`;
  }

  if (n.type === "cocktail_comment") {
    return `${n.actor_nickname} commented on your cocktail`;
  }

  if (n.type === "comment_like") {
    return `${n.actor_nickname} liked your comment`;
  }

  if (n.type === "comment_reply") {
    return `${n.actor_nickname} replied to your comment`;
  }

  if (n.type === "mention") {
    return `${n.actor_nickname} mentioned you`;
  }

  if (n.type === "report_public_cocktail_removed") {
    return `Your cocktail was removed by admin`;
  }

  if (n.type === "report_comment_deleted") {
    return `Your comment was deleted by admin`;
  }

  if (n.type === "report_rejected") {
    return `Your report was rejected by admin`;
  }

  return n.type;
}

export default function NotificationsList() {
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
    if (!window.confirm("Clear all notifications?")) return;

    await notificationsApi.clearAll();
    await load();
  };

  if (error) {
    return <p style={{ color: "#dc2626" }}>{error}</p>;
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <button
          onClick={handleMarkAllRead}
          style={{
            border: "none",
            background: "#111827",
            color: "#ffffff",
            padding: "10px 14px",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          Mark all as read
        </button>

        <button
          onClick={handleClearAll}
          style={{
            border: "none",
            background: "#dc2626",
            color: "#ffffff",
            padding: "10px 14px",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          Clear all
        </button>
      </div>

      {items.length === 0 ? (
        <p>No notifications</p>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {items.map((n) => (
            <div
              key={n.id}
              style={{
                padding: "12px",
                borderRadius: "10px",
                background: n.is_read ? "#f3f4f6" : "#dbeafe",
              }}
            >
              <p style={{ margin: 0 }}>{getNotificationText(n)}</p>

              {n.admin_reason && (
                <p style={{ margin: 0, color: "#b91c1c" }}>
                  <strong>Reason:</strong> {n.admin_reason}
                </p>
              )}

              <small style={{ color: "#6b7280" }}>
                {new Date(n.created_at).toLocaleString("pl-PL")}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}