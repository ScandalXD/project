import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import { getImageUrl } from "../../utils/getImageUrl";
import { Link } from "react-router-dom";

export default function AdminModerationPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await adminApi.getPendingCocktails();
      setItems(data);
    } catch {
      setError("Failed to download cocktails for moderation.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await adminApi.approveCocktail(id);
      await load();
    } catch {
      setError("Failed to approve cocktail.");
    }
  };

  const handleReject = async (id: number) => {
    const reason = window.prompt("Provide a reason for rejection:");
    if (!reason) return;

    try {
      await adminApi.rejectCocktail(id, reason);
      await load();
    } catch {
      setError("Couldn't turn down the cocktail.");
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <h1>Admin Moderation</h1>

      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      {items.length === 0 ? (
        <p>No pending cocktails</p>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {items.map((c) => (
            <div
              key={c.id}
              style={{
                background: "#fff",
                border: "1px solid #ddd",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              {c.image && (
                <img
                  src={getImageUrl(c.image)}
                  alt={c.name}
                  style={{
                    width: "100%",
                    maxHeight: "220px",
                    objectFit: "cover",
                    marginBottom: "12px",
                  }}
                />
              )}

              <h3>{c.name}</h3>
              <p>
                <strong>Author:</strong>{" "}
                <Link to={`/authors/${c.owner_id}`}>{c.owner_nickname}</Link>
              </p>
              <p>
                <strong>Submitted:</strong>{" "}
                {c.submitted_at
                  ? new Date(c.submitted_at).toLocaleString()
                  : "—"}
              </p>
              <p>
                <strong>Category:</strong> {c.category}
              </p>
              <p>
                <strong>Ingredients:</strong> {c.ingredients}
              </p>
              <p>
                <strong>Instructions:</strong> {c.instructions}
              </p>

              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <button onClick={() => handleApprove(c.id)}>Approve</button>
                <button onClick={() => handleReject(c.id)}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
