import { useEffect, useState } from "react";
import { Flag, Heart, MoreHorizontal, Send, Trash2 } from "lucide-react";
import { adminApi } from "../../api/adminApi";
import { commentsApi } from "../../api/commentsApi";
import { reportApi } from "../../api/reportApi";
import { useAuth } from "../../hooks/useAuth";
import type { CommentItemData } from "../../types/comment";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import UserAvatar from "../ui/UserAvatar";
import CommentShareModal from "./CommentShareModal";

interface CommentItemProps {
  comment: CommentItemData;
  onReload: () => Promise<void>;
  targetCommentId?: number | null;
}

function commentTreeContainsId(
  comments: CommentItemData[] | undefined,
  targetCommentId?: number | null,
) {
  if (!targetCommentId || !comments?.length) {
    return false;
  }

  return comments.some(
    (item) =>
      Number(item.id) === Number(targetCommentId) ||
      commentTreeContainsId(item.replies, targetCommentId),
  );
}

function formatCommentAge(createdAt: string) {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (diffMs < minuteMs) return "now";
  if (diffMs < hourMs) return `${Math.max(1, Math.floor(diffMs / minuteMs))} min`;
  if (diffMs < dayMs) return `${Math.floor(diffMs / hourMs)} h`;

  return `${Math.floor(diffMs / dayMs)} d`;
}

export default function CommentItem({
  comment,
  onReload,
  targetCommentId,
}: CommentItemProps) {
  const { isAuthenticated, user } = useAuth();

  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);
  const [showReplies, setShowReplies] = useState(() =>
    commentTreeContainsId(comment.replies, targetCommentId),
  );
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [deleteReason, setDeleteReason] = useState("");

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const canDelete =
    isAuthenticated && (user?.id === comment.user_id || isAdmin);
  const canReport = isAuthenticated && user?.id !== comment.user_id;
  const commentPath =
    comment.cocktail_type === "public"
      ? `/public-cocktails/${comment.cocktail_id}#comment-${comment.id}`
      : `/catalog/${comment.cocktail_id}#comment-${comment.id}`;
  const postPath =
    comment.cocktail_type === "public"
      ? `/public-cocktails/${comment.cocktail_id}`
      : `/catalog/${comment.cocktail_id}`;
  const isTargetComment = Number(comment.id) === Number(targetCommentId);

  useEffect(() => {
    if (commentTreeContainsId(comment.replies, targetCommentId)) {
      setShowReplies(true);
    }
  }, [comment.replies, targetCommentId]);

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
      } ${isTargetComment ? "comment-card-target" : ""}`}
    >
      <UserAvatar
        nickname={comment.author_nickname}
        avatar={comment.author_avatar}
        className="comment-avatar"
      />

      <div className="comment-main">
        <div className="comment-text-line">
          <p className="comment-content">
            <strong className="comment-author-name">
              {comment.author_nickname}
            </strong>{" "}
            <span className="comment-body-text">{comment.content}</span>
          </p>

          <Button
            className="comment-like-button"
            variant={comment.is_liked_by_user ? "danger" : "secondary"}
            disabled={!isAuthenticated || isLiking}
            onClick={handleToggleLike}
            aria-label="Like comment"
            title="Like"
          >
            <Heart
              size={18}
              fill={comment.is_liked_by_user ? "currentColor" : "none"}
              aria-hidden="true"
            />
          </Button>
        </div>

        <div className="comment-meta-row">
          <span title={new Date(comment.created_at).toLocaleString("pl-PL")}>
            {formatCommentAge(comment.created_at)}
          </span>
          {comment.likes_count > 0 && <span>{comment.likes_count} likes</span>}
          {isAuthenticated && (
            <button type="button" onClick={() => setShowReply((prev) => !prev)}>
              Reply
            </button>
          )}

          <div className="comment-menu-wrap">
            <button
              type="button"
              className="comment-menu-trigger"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-label="Open comment actions"
              title="More"
            >
              <MoreHorizontal size={18} aria-hidden="true" />
            </button>

            {isMenuOpen && (
              <div className="comment-menu-popover">
                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setShowShareModal(true);
                    }}
                  >
                    <span>Share</span>
                    <Send size={17} aria-hidden="true" />
                  </button>
                )}

                {canReport && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setShowReportModal(true);
                    }}
                  >
                    <span>Report</span>
                    <Flag size={17} aria-hidden="true" />
                  </button>
                )}

                {canDelete && (
                  <button
                    type="button"
                    className="comment-menu-danger"
                    disabled={isDeleting}
                    onClick={() => {
                      setIsMenuOpen(false);
                      setShowDeleteModal(true);
                      setDeleteReason("");
                    }}
                  >
                    <span>{isDeleting ? "Deleting..." : "Delete"}</span>
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
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
            ? "Hide replies"
            : `View replies (${comment.replies.length})`}
        </button>
      )}

      {showReplies && (
        <div className="comment-replies-list">
          {comment.replies?.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReload={onReload}
              targetCommentId={targetCommentId}
            />
          ))}
        </div>
      )}

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

      {showShareModal && (
        <CommentShareModal
          authorNickname={comment.author_nickname}
          authorAvatar={comment.author_avatar}
          commentContent={comment.content}
          commentPath={commentPath}
          postTitle={comment.cocktail_name || "Cocktail"}
          postImage={comment.cocktail_image || null}
          postPath={postPath}
          onClose={() => setShowShareModal(false)}
        />
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
