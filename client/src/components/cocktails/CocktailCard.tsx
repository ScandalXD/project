import type { CocktailCardData } from "../../types/cocktail";
import { getImageUrl } from "../../utils/getImageUrl";

interface CocktailCardProps {
  cocktail: CocktailCardData;
}

export default function CocktailCard({ cocktail }: CocktailCardProps) {
  return (
    <article className="cocktail-card">
      <div className="cocktail-card-image-wrap">
        {cocktail.image ? (
          <img
            src={getImageUrl(cocktail.image)}
            alt={cocktail.name}
            className="cocktail-card-image"
          />
        ) : (
          <span className="muted-text">No image</span>
        )}
      </div>

      <div className="cocktail-card-body">
        <div className="cocktail-card-title-row">
          <h3 className="cocktail-card-title">{cocktail.name}</h3>
          <span className="category-badge">{cocktail.category}</span>
        </div>

        {cocktail.type === "public" && cocktail.author_nickname && (
          <p className="muted-text cocktail-card-author">
            Autor: {cocktail.author_nickname}
          </p>
        )}

        <p className="cocktail-preview">
          <strong>Składniki:</strong> {cocktail.ingredients}
        </p>

        <p className="cocktail-preview">
          <strong>Przygotowanie:</strong> {cocktail.instructions}
        </p>
      </div>
    </article>
  );
}