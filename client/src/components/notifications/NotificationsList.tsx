import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "../../api/notificationsApi";
import type { Notification } from "../../types/notification";

function getNotificationText(n: Notification) {
  if (n.type === "cocktail_approved") return "Your cocktail was approved";
  if (n.type === "cocktail_rejected") return "Your cocktail was rejected";
  if (n.type === "cocktail_like")
    return `${n.actor_nickname} liked your cocktail`;
  if (n.type === "cocktail_comment")
    return `${n.actor_nickname} commented on your cocktail`;
  if (n.type === "comment_like")
    return `${n.actor_nickname} liked your comment`;
  if (n.type === "comment_reply")
    return `${n.actor_nickname} replied to your comment`;
  if (n.type === "mention") return `${n.actor_nickname} mentioned you`;
  if (n.type === "report_public_cocktail_removed")
    return "Your cocktail was removed by admin";
  if (n.type === "report_comment_deleted")
    return "Your comment was deleted by admin";
  if (n.type === "report_rejected") return "Your report was rejected by admin";

  return n.type;
}

function getNotificationIcon(n: Notification) {
  if (n.type === "cocktail_approved") return "✅";
  if (n.type === "cocktail_rejected") return "❌";
  if (n.type === "cocktail_like" || n.type === "comment_like") return "❤️";
  if (n.type === "cocktail_comment" || n.type === "comment_reply") return "💬";
  if (n.type === "mention") return "👤";
  if (n.type.includes("report")) return "⚠️";

  return "🔔";
}

function getNotificationBackground(n: Notification) {
  if (n.is_read) return "#f3f4f6";

  if (n.type === "cocktail_approved") return "#dcfce7";
  if (n.type === "cocktail_rejected") return "#fee2e2";
  if (n.type.includes("report")) return "#fef3c7";
  if (n.type === "cocktail_like" || n.type === "comment_like") return "#ffe4e6";
  if (n.type === "cocktail_comment" || n.type === "comment_reply")
    return "#dbeafe";
  if (n.type === "mention") return "#ede9fe";

  return "#dbeafe";
}

function getNotificationPath(n: Notification) {
  if (n.type === "cocktail_approved") {
    return `/public-cocktails/${n.recipe_id}`;
  }

  if (n.type === "cocktail_rejected") {
    return `/my-cocktails/${n.recipe_id}`;
  }

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

  return null;
}

export default function NotificationsList() {
  const navigate = useNavigate();

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
          {items.map((n) => {
            const path = getNotificationPath(n);

            return (
              <div
                key={n.id}
                onClick={async () => {
                  if (!n.is_read) {
                    await notificationsApi.markAsRead(n.id);
                  }

                  if (path) navigate(path);
                }}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  background: getNotificationBackground(n),
                  cursor: path ? "pointer" : "default",
                }}
              >
                <p style={{ margin: 0, fontWeight: 600 }}>
                  <span style={{ marginRight: "8px" }}>
                    {getNotificationIcon(n)}
                  </span>
                  {getNotificationText(n)}
                </p>

                {n.admin_reason && (
                  <p style={{ margin: "6px 0 0", color: "#b91c1c" }}>
                    <strong>Reason:</strong> {n.admin_reason}
                  </p>
                )}

                <small style={{ color: "#6b7280" }}>
                  {new Date(n.created_at).toLocaleString("pl-PL")}
                </small>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
