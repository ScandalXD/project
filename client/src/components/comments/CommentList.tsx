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
    <section style={{ marginTop: "30px" }}>
      <h2 style={{ marginBottom: "12px" }}>Comments</h2>

      {isAuthenticated ? (
        <div style={{ marginBottom: "18px" }}>
          <CommentForm onSubmit={handleAddComment} />
        </div>
      ) : (
        <p style={{ color: "#6b7280" }}>
          Log in to add a comment or reply.
        </p>
      )}

      {isLoading ? (
        <div>Loading comments...</div>
      ) : error ? (
        <div style={{ color: "#dc2626" }}>{error}</div>
      ) : comments.length === 0 ? (
        <div>No comments yet.</div>
      ) : (
        <div>
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