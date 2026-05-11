import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { cocktailsApi } from "../../api/cocktailsApi";
import { getImageUrl } from "../../utils/getImageUrl";
import CommentList from "../../components/comments/CommentList";
import type { CatalogCocktail } from "../../types/cocktail";

export default function CatalogCocktailDetailsPage() {
  const { id } = useParams();

  const [cocktail, setCocktail] = useState<CatalogCocktail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCocktail = async () => {
      try {
        const list = await cocktailsApi.getCatalogCocktails();
        const found = list.find((item) => item.id === id);

        if (!found) {
          setError("Cocktail not found.");
          return;
        }

        setCocktail(found);
      } catch {
        setError("Could not load cocktail.");
      }
    };

    loadCocktail();
  }, [id]);

  if (error) {
    return <p className="error-text">{error}</p>;
  }

  if (!cocktail) {
    return <p className="muted-text">Loading...</p>;
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

      <h1>{cocktail.name}</h1>

      <p>
        <strong>Category:</strong> {cocktail.category}
      </p>

      <p>
        <strong>Ingredients:</strong> {cocktail.ingredients}
      </p>

      <p>
        <strong>Instructions:</strong> {cocktail.instructions}
      </p>

      <CommentList cocktailId={cocktail.id} type="catalog" />
    </div>
  );
}