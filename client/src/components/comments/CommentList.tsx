import { useEffect, useState } from "react";
import { commentsApi } from "../../api/commentsApi";
import { useAuth } from "../../hooks/useAuth";
import type { CommentCocktailType, CommentItemData } from "../../types/comment";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";

interface CommentListProps {
  cocktailId: string | number;
  type: CommentCocktailType;
}

export default function CommentList({ cocktailId, type }: CommentListProps) {
  const { isAuthenticated } = useAuth();

  const [comments, setComments] = useState<CommentItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadComments = async () => {
    try {
      setError("");

      const data = await commentsApi.getComments(String(cocktailId), type);
      setComments(data);
    } catch {
      setError("Could not load comments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [cocktailId, type]);

  const handleAddComment = async (content: string) => {
    await commentsApi.addComment({
      cocktailId: String(cocktailId),
      cocktailType: type,
      content,
    });

    await loadComments();
  };

  return (
    <section className="comments-section">
      <h2 className="comments-title">Comments</h2>

      {isAuthenticated ? (
        <div className="comments-form-wrap">
          <CommentForm onSubmit={handleAddComment} />
        </div>
      ) : (
        <p className="muted-text">Log in to add a comment or reply.</p>
      )}

      {isLoading ? (
        <div className="empty-state">Loading comments...</div>
      ) : error ? (
        <div className="empty-state error-text">{error}</div>
      ) : comments.length === 0 ? (
        <div className="empty-state">No comments yet.</div>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReload={loadComments}
            />
          ))}
        </div>
      )}
    </section>
  );
}