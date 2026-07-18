import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { cocktailsApi } from "../../api/cocktailsApi";
import { formatCocktailCategory } from "../../utils/formatCocktailCategory";
import { getImageUrl } from "../../utils/getImageUrl";
import CommentList from "../../components/comments/CommentList";
import BackButton from "../../components/ui/BackButton";
import type { PublicCocktail } from "../../types/cocktail";

export default function PublicCocktailDetailsPage() {
  const { id } = useParams();

  const [cocktail, setCocktail] = useState<PublicCocktail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCocktail = async () => {
      try {
        const list = await cocktailsApi.getPublicCocktails();
        const found = list.find((item) => String(item.id) === String(id));

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

  useEffect(() => {
    const hash = window.location.hash;

    if (!hash) return;

    setTimeout(() => {
      const element = document.querySelector(hash);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 500);
  }, []);

  if (error) {
    return <p className="error-text">{error}</p>;
  }

  if (!cocktail) {
    return <p className="muted-text">Loading...</p>;
  }

  return (
    <div className="page-container details-page">
      <BackButton to="/public-cocktails" label="Public Cocktails" />

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
        <strong>Category:</strong> {formatCocktailCategory(cocktail.category)}
      </p>

      <p>
        <strong>Ingredients:</strong> {cocktail.ingredients}
      </p>

      <p>
        <strong>Instructions:</strong> {cocktail.instructions}
      </p>

      <CommentList cocktailId={cocktail.id} type="public" />
    </div>
  );
}
