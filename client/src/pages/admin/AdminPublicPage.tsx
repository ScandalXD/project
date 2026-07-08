import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import { cocktailsApi } from "../../api/cocktailsApi";
import { formatCocktailCategory } from "../../utils/formatCocktailCategory";
import { getImageUrl } from "../../utils/getImageUrl";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import type { PublicCocktail } from "../../types/cocktail";

export default function AdminPublicPage() {
  const [items, setItems] = useState<PublicCocktail[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  const loadPublic = async () => {
    try {
      const data = await cocktailsApi.getPublicCocktails();
      setItems(data);
    } catch {
      setError("Failed to load public cocktails.");
    }
  };

  useEffect(() => {
    loadPublic();
  }, []);

  const handleDelete = async () => {
    if (!deleteId || !deleteReason.trim()) return;

    setError("");
    setMessage("");

    try {
      await adminApi.deletePublicCocktail(deleteId, deleteReason.trim());
      setMessage("Public cocktail deleted.");
      setDeleteId(null);
      setDeleteReason("");
      await loadPublic();
    } catch {
      setError("Failed to delete public cocktail.");
    }
  };

  return (
    <div className="page-container">
      <div className="admin-page-header">
        <h1>Admin Public Cocktails</h1>
      </div>

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      {items.length === 0 ? (
        <EmptyState text="No public cocktails" />
      ) : (
        <div className="admin-grid">
          {items.map((item) => (
            <div key={item.id} className="admin-card">
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
                <strong>Author:</strong> {item.author_nickname}
              </p>

              <p>
                <strong>Category:</strong> {formatCocktailCategory(item.category)}
              </p>

              <p>
                <strong>Ingredients:</strong> {item.ingredients}
              </p>

              <p>
                <strong>Instructions:</strong> {item.instructions}
              </p>

              <div className="admin-card-actions">
                <Button
                  variant="danger"
                  onClick={() => {
                    setDeleteId(Number(item.id));
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

      {deleteId && (
        <Modal
          title="Delete public cocktail"
          onClose={() => {
            setDeleteId(null);
            setDeleteReason("");
          }}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setDeleteId(null);
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
