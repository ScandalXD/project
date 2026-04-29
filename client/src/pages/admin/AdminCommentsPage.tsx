import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import { Link } from "react-router-dom";

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

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await adminApi.getComments();
      setComments(data);
    } catch {
      setError("Failed to load comments");
    }
  };

  if (error) return <div>{error}</div>;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <h2>All Comments</h2>

      {comments.map((c) => (
        <div
          key={c.id}
          style={{
            border: "1px solid #ddd",
            padding: "16px",
            marginBottom: "16px",
            borderRadius: "10px",
          }}
        >
          <p><b>{c.author_nickname}</b></p>
          <p>{c.content}</p>
          <p style={{ fontSize: "12px", opacity: 0.6 }}>
            {c.created_at}
          </p>

          <Link
            to={`/${c.cocktail_type === "public" ? "public-cocktails" : "catalog"}/${c.cocktail_id}#comment-${c.id}`}
          >
            View comment
          </Link>
        </div>
      ))}
    </div>
  );
}