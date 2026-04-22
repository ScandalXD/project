import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import { cocktailsApi } from "../../api/cocktailsApi";
import { getImageUrl } from "../../utils/getImageUrl";
import type { CatalogCocktail } from "../../types/cocktail";

export default function AdminCatalogPage() {
  const [items, setItems] = useState<CatalogCocktail[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCatalog = async () => {
    try {
      const data = await cocktailsApi.getCatalogCocktails();
      setItems(data);
    } catch {
      setError("Nie udało się pobrać katalogu.");
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete this catalog cocktail?");
    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await adminApi.deleteCatalogCocktail(id);
      setMessage("Catalog cocktail deleted.");
      await loadCatalog();
    } catch {
      setError("Nie udało się usunąć koktajlu katalogowego.");
    }
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <h1>Admin Catalog</h1>

        <Link
          to="/admin/catalog/create"
          style={{
            textDecoration: "none",
            background: "#111827",
            color: "#ffffff",
            padding: "12px 16px",
            borderRadius: "10px",
          }}
        >
          + Create
        </Link>
      </div>

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
              <strong>Category:</strong> {item.category}
            </p>
            <p>
              <strong>Ingredients:</strong> {item.ingredients}
            </p>
            <p>
              <strong>Instructions:</strong> {item.instructions}
            </p>

            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <Link
                to={`/admin/catalog/${item.id}/edit`}
                style={{
                  textDecoration: "none",
                  background: "#f59e0b",
                  color: "#ffffff",
                  padding: "10px 14px",
                  borderRadius: "10px",
                }}
              >
                Edit
              </Link>

              <button onClick={() => handleDelete(item.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}