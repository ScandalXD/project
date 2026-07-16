import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import { cocktailsApi } from "../../api/cocktailsApi";
import { formatCocktailCategory } from "../../utils/formatCocktailCategory";
import { getImageUrl } from "../../utils/getImageUrl";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
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
      setError("Failed to load catalog.");
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Delete this catalog cocktail?"
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await adminApi.deleteCatalogCocktail(id);
      setMessage("Catalog cocktail deleted.");
      await loadCatalog();
    } catch {
      setError("Failed to delete catalog cocktail.");
    }
  };

  return (
    <div className="page-container">
      <Link to="/admin" className="page-back-button admin-dashboard-back">
        <ArrowLeft size={18} aria-hidden="true" />
        <span>Dashboard</span>
      </Link>

      <div className="admin-page-header">
        <h1>Admin Catalog</h1>

        <Link
          to="/admin/catalog/create"
          className="admin-create-link"
        >
          + Create
        </Link>
      </div>

      {message && (
        <p className="success-text">
          {message}
        </p>
      )}

      {error && (
        <p className="error-text">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <EmptyState text="No catalog cocktails" />
      ) : (
        <div className="admin-grid">
          {items.map((item) => (
            <div
              key={item.id}
              className="admin-card"
            >
              {item.image && (
                <img
                  src={getImageUrl(item.image)}
                  alt={item.name}
                  className="admin-card-image"
                />
              )}

              <h3>{item.name}</h3>

              <p>
                <strong>ID:</strong> {item.id}
              </p>

              <p>
                <strong>Category:</strong>{" "}
                {formatCocktailCategory(item.category)}
              </p>

              <p>
                <strong>Ingredients:</strong>{" "}
                {item.ingredients}
              </p>

              <p>
                <strong>Instructions:</strong>{" "}
                {item.instructions}
              </p>

              <div className="admin-card-actions">
                <Link
                  to={`/admin/catalog/${item.id}/edit`}
                  className="admin-edit-link"
                >
                  Edit
                </Link>

                <Button
                  variant="danger"
                  onClick={() => handleDelete(item.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
