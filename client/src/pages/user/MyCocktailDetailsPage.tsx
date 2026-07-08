import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { cocktailsApi } from "../../api/cocktailsApi";
import { formatCocktailCategory } from "../../utils/formatCocktailCategory";
import { getImageUrl } from "../../utils/getImageUrl";
import type { UserCocktail } from "../../types/cocktail";

const statusLabels: Record<UserCocktail["publication_status"], string> = {
  draft: "Draft",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export default function CocktailDetailsPage() {
  const { id } = useParams();
  const [cocktail, setCocktail] = useState<UserCocktail | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setError("");

        const list = await cocktailsApi.getMyCocktails();
        const found = list.find((item) => item.id === Number(id));

        if (!found) {
          setError("Cocktail not found");
          return;
        }

        setCocktail(found);
      } catch {
        setError("Error loading cocktail");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id]);

  if (isLoading) {
    return (
      <div className="page-container details-page">
        <div className="empty-state">Loading cocktail...</div>
      </div>
    );
  }

  if (error || !cocktail) {
    return (
      <div className="page-container details-page">
        <div className="empty-state error-text">
          {error || "Cocktail not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container details-page">
      {cocktail.image && (
        <div className="details-image-wrap">
          <img
            src={getImageUrl(cocktail.image)}
            alt={cocktail.name}
            className="details-image"
          />
        </div>
      )}

      <div className="card details-card">
        <div className="cocktail-card-title-row">
          <div>
            <h1 className="details-title">{cocktail.name}</h1>

            <div className="badge-row">
              <span className="category-badge">
                {formatCocktailCategory(cocktail.category)}
              </span>
              <span
                className={`status-badge status-${cocktail.publication_status}`}
              >
                {statusLabels[cocktail.publication_status]}
              </span>
            </div>
          </div>
        </div>

        {cocktail.publication_status === "rejected" &&
          cocktail.moderation_reason && (
            <p className="error-text details-warning">
              <strong>Moderation reason:</strong>{" "}
              {cocktail.moderation_reason}
            </p>
          )}

        <section className="details-section">
          <h3>Ingredients</h3>
          <p>{cocktail.ingredients}</p>
        </section>

        <section className="details-section">
          <h3>Instructions</h3>
          <p>{cocktail.instructions}</p>
        </section>
      </div>
    </div>
  );
}
