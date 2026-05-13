import { useState } from "react";
import { commentsApi } from "../../api/commentsApi";
import { adminApi } from "../../api/adminApi";
import { reportApi } from "../../api/reportApi";
import { useAuth } from "../../hooks/useAuth";
import type { CommentItemData } from "../../types/comment";

import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";

interface CommentItemProps {
  comment: CommentItemData;
  onReload: () => Promise<void>;
}

export default function CommentItem({ comment, onReload }: CommentItemProps) {
  const { isAuthenticated, user } = useAuth();

  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [deleteReason, setDeleteReason] = useState("");

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const canDelete =
    isAuthenticated && (user?.id === comment.user_id || isAdmin);
  const canReport = isAuthenticated && user?.id !== comment.user_id;

  const handleToggleLike = async () => {
    if (!isAuthenticated || isLiking) return;

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

  const handleReply = async () => {
    if (!replyText.trim()) return;

    await commentsApi.addComment({
      cocktailId: String(comment.cocktail_id),
      cocktailType: comment.cocktail_type,
      content: replyText.trim(),
      parentCommentId: comment.id,
    });

    setReplyText("");
    setShowReply(false);
    await onReload();
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      if (isAdmin && user?.id !== comment.user_id) {
        if (!deleteReason.trim()) return;

        await adminApi.deleteAnyComment(comment.id, deleteReason.trim());
      } else {
        await commentsApi.deleteComment(comment.id);
      }

      setShowDeleteModal(false);
      setDeleteReason("");
      await onReload();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;

    await reportApi.reportComment(comment.id, reportReason.trim());

    setReportReason("");
    setShowReportModal(false);
  };

  return (
    <div
      id={`comment-${comment.id}`}
      className={`comment-card ${
        comment.parent_comment_id ? "comment-card-reply" : ""
      }`}
    >
      <div className="comment-header">
        <strong>{comment.author_nickname}</strong>

        <span className="muted-text">
          {new Date(comment.created_at).toLocaleString("pl-PL")}
        </span>
      </div>

      <p className="comment-content">{comment.content}</p>

      <div className="comment-actions">
        <Button
          variant={comment.is_liked_by_user ? "danger" : "secondary"}
          disabled={!isAuthenticated || isLiking}
          onClick={handleToggleLike}
        >
          ❤️ {comment.likes_count}
        </Button>

        {isAuthenticated && (
          <Button variant="info" onClick={() => setShowReply((prev) => !prev)}>
            Reply
          </Button>
        )}

        {canDelete && (
          <Button
            variant="danger"
            disabled={isDeleting}
            onClick={() => {
              setShowDeleteModal(true);
              setDeleteReason("");
            }}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        )}

        {canReport && (
          <Button variant="warning" onClick={() => setShowReportModal(true)}>
            Report
          </Button>
        )}
      </div>

      {showReply && (
        <div className="comment-reply-box">
          <Input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write reply..."
          />

          <div className="comment-actions">
            <Button onClick={handleReply}>Send</Button>

            <Button variant="secondary" onClick={() => setShowReply(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <button
          type="button"
          className="comment-replies-toggle"
          onClick={() => setShowReplies((prev) => !prev)}
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

      {showDeleteModal && (
        <Modal
          title="Delete comment"
          onClose={() => {
            setShowDeleteModal(false);
            setDeleteReason("");
          }}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteReason("");
                }}
              >
                Cancel
              </Button>

              <Button
                variant="danger"
                disabled={
                  isDeleting ||
                  (isAdmin &&
                    user?.id !== comment.user_id &&
                    !deleteReason.trim())
                }
                onClick={handleDelete}
              >
                Delete
              </Button>
            </>
          }
        >
          <div className="modal-form">
            <p className="muted-text">
              Are you sure you want to delete this comment?
            </p>

            {isAdmin && user?.id !== comment.user_id && (
              <Input
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Admin reason"
              />
            )}
          </div>
        </Modal>
      )}

      {showReportModal && (
        <Modal
          title="Report comment"
          onClose={() => {
            setShowReportModal(false);
            setReportReason("");
          }}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason("");
                }}
              >
                Cancel
              </Button>

              <Button
                variant="warning"
                disabled={!reportReason.trim()}
                onClick={handleReport}
              >
                Report
              </Button>
            </>
          }
        >
          <div className="modal-form">
            <Input
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Reason"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}