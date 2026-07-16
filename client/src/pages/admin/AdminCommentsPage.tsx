import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/adminApi";

import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";

type Comment = {
  id: number;
  content: string;
  cocktail_id: number;
  cocktail_type: "public" | "catalog";
  parent_id: number | null;
  author_nickname: string;
  created_at: string;
};

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  const load = async () => {
    try {
      const data = await adminApi.getComments();
      setComments(data);
    } catch {
      setError("Failed to load comments");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async () => {
    if (!deleteCommentId || !deleteReason.trim()) return;

    setError("");
    setMessage("");

    try {
      await adminApi.deleteAnyComment(deleteCommentId, deleteReason.trim());
      setMessage("Comment deleted.");
      setDeleteCommentId(null);
      setDeleteReason("");
      await load();
    } catch {
      setError("Failed to delete comment.");
    }
  };

  return (
    <div className="page-container">
      <Link to="/admin" className="page-back-button admin-dashboard-back">
        <ArrowLeft size={18} aria-hidden="true" />
        <span>Dashboard</span>
      </Link>

      <div className="admin-page-header">
        <h1>All Comments</h1>
      </div>

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      {comments.length === 0 ? (
        <EmptyState text="No comments found" />
      ) : (
        <div className="admin-grid">
          {comments.map((c) => (
            <div key={c.id} className="admin-card">
              <h3 style={{ marginTop: 0 }}>{c.author_nickname}</h3>

              <p>{c.content}</p>

              <p className="muted-text">
                {new Date(c.created_at).toLocaleString("pl-PL")}
              </p>

              <p>
                <strong>Type:</strong> {c.cocktail_type}
              </p>

              <p>
                <strong>Cocktail ID:</strong> {c.cocktail_id}
              </p>

              <div className="admin-card-actions">
                <Link
                  to={`/${
                    c.cocktail_type === "public"
                      ? "public-cocktails"
                      : "catalog"
                  }/${c.cocktail_id}#comment-${c.id}`}
                  className="admin-create-link"
                >
                  View comment
                </Link>

                <Button
                  variant="danger"
                  onClick={() => {
                    setDeleteCommentId(c.id);
                    setDeleteReason("");
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteCommentId && (
        <Modal
          title="Delete comment"
          onClose={() => {
            setDeleteCommentId(null);
            setDeleteReason("");
          }}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setDeleteCommentId(null);
                  setDeleteReason("");
                }}
              >
                Cancel
              </Button>

              <Button
                variant="danger"
                disabled={!deleteReason.trim()}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </>
          }
        >
          <p className="muted-text">Provide reason for deletion:</p>

          <Input
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            placeholder="Admin reason"
          />
        </Modal>
      )}
    </div>
  );
}
