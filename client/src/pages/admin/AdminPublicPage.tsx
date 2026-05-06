import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import { cocktailsApi } from "../../api/cocktailsApi";
import { getImageUrl } from "../../utils/getImageUrl";
import type { PublicCocktail } from "../../types/cocktail";

export default function AdminPublicPage() {
  const [items, setItems] = useState<PublicCocktail[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadPublic = async () => {
    try {
      const data = await cocktailsApi.getPublicCocktails();
      setItems(data);
    } catch {
      setError("Nie udało się pobrać publicznych koktajli.");
    }
  };

  useEffect(() => {
    loadPublic();
  }, []);

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Delete this public cocktail?");
    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await adminApi.deletePublicCocktail(id);
      setMessage("Public cocktail deleted.");
      await loadPublic();
    } catch {
      setError("Nie udało się usunąć publicznego koktajlu.");
    }
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "24px" }}>Admin Public Cocktails</h1>

      {message && <p style={{ color: "#059669" }}>{message}</p>}
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "20px",
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              background: "#ffffff",
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            {item.image && (
              <img
                src={getImageUrl(item.image)}
                alt={item.name}
                style={{
                  width: "100%",
                  height: "220px",
                  objectFit: "cover",
                  marginBottom: "12px",
                  borderRadius: "8px",
                }}
              />
            )}

            <h3>{item.name}</h3>

            <p>
              <strong>ID:</strong> {item.id}
            </p>

            <p>
              <strong>Author:</strong> {item.author_nickname}
            </p>

            <p>
              <strong>Category:</strong> {item.category}
            </p>

            <p>
              <strong>Ingredients:</strong> {item.ingredients}
            </p>

            <p>
              <strong>Instructions:</strong> {item.instructions}
            </p>

            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button onClick={() => handleDelete(Number(item.id))}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}