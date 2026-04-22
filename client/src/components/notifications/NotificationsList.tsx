import { useEffect, useState } from "react";
import {
  notificationsApi,
  type NotificationItem,
} from "../../api/notificationsApi";
import { useNavigate } from "react-router-dom";

function getNotificationText(n: NotificationItem) {
  if (n.type === "mention") {
    return `${n.actor_nickname ?? "Someone"} mentioned you in a comment`;
  }

  if (n.type === "cocktail_like") {
    return `${n.actor_nickname ?? "Someone"} liked your cocktail`;
  }

  if (n.type === "cocktail_comment") {
    return `${n.actor_nickname ?? "Someone"} commented on your cocktail`;
  }

  if (n.type === "comment_like") {
    return `${n.actor_nickname ?? "Someone"} liked your comment`;
  }

  if (n.type === "comment_reply") {
    return `${n.actor_nickname ?? "Someone"} replied to your comment`;
  }

  if (n.type === "report_public_cocktail_removed") {
    return "Your public cocktail was removed by admin";
  }

  if (n.type === "report_comment_deleted") {
    return "Your comment was deleted by admin";
  }

  return "Notification";
}

export default function NotificationsList() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const navigate = useNavigate();

  const load = async () => {
    const data = await notificationsApi.getNotifications();
    setNotifications(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleClick = async (n: NotificationItem) => {
    if (!n.is_read) {
      await notificationsApi.markAsRead(n.id);
    }

    if (n.recipe_type === "public") {
      navigate(`/public-cocktails/${n.recipe_id}`);
    }

    if (n.recipe_type === "catalog") {
      navigate(`/catalog/${n.recipe_id}`);
    }

    await load();
  };

  const handleMarkAll = async () => {
    await notificationsApi.markAllAsRead();
    await load();
  };

  return (
    <div>
      {notifications.length > 0 && (
        <button
          onClick={handleMarkAll}
          style={{
            border: "none",
            background: "#111827",
            color: "#ffffff",
            padding: "10px 14px",
            borderRadius: "10px",
            cursor: "pointer",
            marginBottom: "16px",
          }}
        >
          Mark all as read
        </button>
      )}

      {notifications.length === 0 ? (
        <p>No notifications</p>
      ) : (
        notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => handleClick(n)}
            style={{
              padding: "12px",
              marginBottom: "10px",
              borderRadius: "10px",
              cursor: "pointer",
              background: n.is_read ? "#f3f4f6" : "#dbeafe",
            }}
          >
            <div style={{ fontWeight: 600 }}>{getNotificationText(n)}</div>

            {n.comment_content && (
              <div style={{ marginTop: "6px", color: "#374151" }}>
                {n.comment_content}
              </div>
            )}

            {n.admin_reason && (
              <div style={{ marginTop: "6px", color: "#b91c1c" }}>
                Reason: {n.admin_reason}
              </div>
            )}

            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "6px" }}>
              {new Date(n.created_at).toLocaleString()}
            </div>
          </div>
        ))
      )}
    </div>
  );
}