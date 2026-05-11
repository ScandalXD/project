import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cocktailsApi } from "../../api/cocktailsApi";
import { getImageUrl } from "../../utils/getImageUrl";
import type { UserCocktail } from "../../types/cocktail";

import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";

function getStatusLabel(status: UserCocktail["publication_status"]) {
  if (status === "draft") return "Draft";
  if (status === "pending") return "Pending moderation";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return status;
}

function getStatusClass(status: UserCocktail["publication_status"]) {
  return `status-badge status-${status}`;
}

export default function MyCocktailsPage() {
  const navigate = useNavigate();

  const [cocktails, setCocktails] = useState<UserCocktail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const loadCocktails = async () => {
    try {
      const data = await cocktailsApi.getMyCocktails();
      setCocktails(data);
    } catch {
      setError("Nie udało się pobrać Twoich koktajli.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCocktails();
  }, []);

  const handlePublish = async (id: number) => {
    setError("");
    setActionMessage("");

    try {
      await cocktailsApi.publishCocktail(id);
      setActionMessage("Cocktail submitted for moderation.");
      await loadCocktails();
    } catch {
      setError("Nie udało się wysłać koktajlu do moderacji.");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setError("");
    setActionMessage("");

    try {
      await cocktailsApi.deleteCocktail(deleteId);
      setActionMessage("Cocktail deleted.");
      setDeleteId(null);
      await loadCocktails();
    } catch {
      setError("Nie udało się usunąć koktajlu.");
    }
  };

  if (isLoading) {
    return <p className="muted-text">Loading your cocktails...</p>;
  }

  if (error && cocktails.length === 0) {
    return <p className="error-text">{error}</p>;
  }

  return (
    <div className="page-container">
      <div className="admin-page-header">
        <div>
          <h1>My Cocktails</h1>
          <p className="muted-text">Zarządzaj swoimi własnymi koktajlami.</p>
        </div>

        <Link to="/my-cocktails/create" className="admin-create-link">
          + Create
        </Link>
      </div>

      {actionMessage && <p className="success-text">{actionMessage}</p>}
      {error && <p className="error-text">{error}</p>}

      {cocktails.length === 0 ? (
        <EmptyState text="Nie masz jeszcze żadnych koktajli." />
      ) : (
        <div className="my-cocktails-grid">
          {cocktails.map((cocktail) => (
            <article
              key={cocktail.id}
              className="my-cocktail-card"
              onClick={() => navigate(`/my-cocktails/${cocktail.id}`)}
            >
              <div className="my-cocktail-image-wrap">
                {cocktail.image ? (
                  <img
                    src={getImageUrl(cocktail.image)}
                    alt={cocktail.name}
                    className="my-cocktail-image"
                  />
                ) : (
                  <span className="muted-text">No image</span>
                )}
              </div>

              <div className="my-cocktail-content">
                <div className="my-cocktail-header">
                  <h3>{cocktail.name}</h3>

                  <div className="badge-row">
                    <span className="category-badge">{cocktail.category}</span>
                    <span className={getStatusClass(cocktail.publication_status)}>
                      {getStatusLabel(cocktail.publication_status)}
                    </span>
                  </div>
                </div>

                <p>
                  <strong>Składniki:</strong> {cocktail.ingredients}
                </p>

                <p>
                  <strong>Przygotowanie:</strong> {cocktail.instructions}
                </p>

                {cocktail.moderation_reason && (
                  <p className="error-text">
                    <strong>Moderation reason:</strong>{" "}
                    {cocktail.moderation_reason}
                  </p>
                )}

                <div className="admin-card-actions">
                  {(cocktail.publication_status === "draft" ||
                    cocktail.publication_status === "rejected") && (
                    <Button
                      variant="info"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePublish(cocktail.id);
                      }}
                    >
                      Publish
                    </Button>
                  )}

                  {cocktail.publication_status !== "pending" && (
                    <Link
                      to={`/my-cocktails/${cocktail.id}/edit`}
                      className="admin-edit-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Edit
                    </Link>
                  )}

                  <Button
                    variant="danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(cocktail.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {deleteId && (
        <Modal
          title="Delete cocktail"
          onClose={() => setDeleteId(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>

              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            </>
          }
        >
          <p className="muted-text">
            Are you sure you want to delete this cocktail?
          </p>
        </Modal>
      )}
    </div>
  );
}