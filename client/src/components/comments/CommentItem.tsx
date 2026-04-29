import { useState } from "react";
import { commentsApi } from "../../api/commentsApi";
import { useAuth } from "../../hooks/useAuth";
import type { CommentItemData } from "../../types/comment";
import ReplyForm from "./ReplyForm";
import ReportButton from "../reports/ReportButton";

interface CommentItemProps {
  comment: CommentItemData;
  onReload: () => Promise<void>;
}

export default function CommentItem({ comment, onReload }: CommentItemProps) {
  const { isAuthenticated, user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const handleReply = async (content: string) => {
    await commentsApi.addComment({
      cocktailId: comment.cocktail_id,
      cocktailType: comment.cocktail_type,
      content,
      parentCommentId: comment.id,
    });

    setShowReplyForm(false);
    await onReload();
  };

  const handleToggleLike = async () => {
    if (!isAuthenticated || isLiking) {
      return;
    }

    setIsLiking(true);

    try {
      if (comment.is_liked_by_user) {
        await commentsApi.removeCommentLike(comment.id);
      } else {
        await commentsApi.addCommentLike(comment.id);
      }

      await onReload();
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this comment?")) {
      return;
    }

    setIsDeleting(true);

    try {
      await commentsApi.deleteComment(comment.id);
      await onReload();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      id={`comment-${comment.id}`}
      style={{
        marginTop: "14px",
        paddingLeft: comment.parent_comment_id ? "22px" : "0",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "12px",
        }}
      >
        <div style={{ marginBottom: "6px", fontWeight: 600 }}>
          {comment.author_nickname}
        </div>

        <div style={{ color: "#374151", marginBottom: "10px" }}>
          {comment.content}
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={handleToggleLike}
            disabled={!isAuthenticated || isLiking}
            style={{
              border: "none",
              background: comment.is_liked_by_user ? "#dc2626" : "#e5e7eb",
              color: comment.is_liked_by_user ? "#ffffff" : "#111827",
              padding: "8px 12px",
              borderRadius: "8px",
              cursor: isAuthenticated ? "pointer" : "not-allowed",
            }}
          >
            ❤️ {comment.likes_count}
          </button>

          {isAuthenticated && (
            <button
              onClick={() => setShowReplyForm((prev) => !prev)}
              style={{
                border: "none",
                background: "#2563eb",
                color: "#ffffff",
                padding: "8px 12px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Reply
            </button>
          )}

          {isAuthenticated && user?.id === comment.user_id && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                border: "none",
                background: "#111827",
                color: "#ffffff",
                padding: "8px 12px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}
          <ReportButton type="comment" id={comment.id} />
        </div>

        {showReplyForm && isAuthenticated && (
          <ReplyForm onSubmit={handleReply} />
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <button
          onClick={() => setShowReplies((prev) => !prev)}
          style={{
            marginTop: "8px",
            border: "none",
            background: "transparent",
            color: "#2563eb",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {showReplies
            ? "▲ Hide replies"
            : `▼ ${comment.replies.length} ${
                comment.replies.length === 1 ? "reply" : "replies"
              }`}
        </button>
      )}

      {showReplies &&
        comment.replies?.map((reply) => (
          <CommentItem key={reply.id} comment={reply} onReload={onReload} />
        ))}
    </div>
  );
}
