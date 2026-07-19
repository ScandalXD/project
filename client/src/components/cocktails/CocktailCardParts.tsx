import { Bookmark } from "lucide-react";
import type { CocktailCardData } from "../../types/cocktail";
import { formatCocktailCategory } from "../../utils/formatCocktailCategory";
import { getImageUrl } from "../../utils/getImageUrl";

interface CocktailCardImageProps {
  cocktail: Pick<CocktailCardData, "image" | "name">;
}

interface CocktailCardSummaryProps {
  cocktail: Pick<
    CocktailCardData,
    "name" | "category" | "ingredients" | "instructions" | "author_nickname"
  >;
  showAuthor?: boolean;
  showIngredientsLabel?: boolean;
  showInstructions?: boolean;
  previewLimit?: number;
}

interface FavoriteRemoveButtonProps {
  disabled?: boolean;
  onClick: () => void;
}

export function CocktailCardImage({ cocktail }: CocktailCardImageProps) {
  return (
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
  );
}

export function CocktailCardSummary({
  cocktail,
  showAuthor = false,
  showIngredientsLabel,
  showInstructions = true,
  previewLimit,
}: CocktailCardSummaryProps) {
  const ingredients =
    previewLimit && cocktail.ingredients.length > previewLimit
      ? `${cocktail.ingredients.slice(0, previewLimit)}...`
      : cocktail.ingredients;
  const shouldShowIngredientsLabel = showIngredientsLabel ?? showInstructions;

  return (
    <div className="cocktail-card-body">
      <div className="cocktail-card-title-row">
        <h3 className="cocktail-card-title">{cocktail.name}</h3>
        <span className="category-badge">
          {formatCocktailCategory(cocktail.category)}
        </span>
      </div>

      {showAuthor && cocktail.author_nickname && (
        <p className="muted-text cocktail-card-author">
          Author: {cocktail.author_nickname}
        </p>
      )}

      <p className="cocktail-preview">
        {shouldShowIngredientsLabel && <strong>Ingredients: </strong>}
        {ingredients}
      </p>

      {showInstructions && (
        <p className="cocktail-preview">
          <strong>Instructions: </strong>
          {cocktail.instructions}
        </p>
      )}
    </div>
  );
}

export function FavoriteRemoveButton({
  disabled,
  onClick,
}: FavoriteRemoveButtonProps) {
  return (
    <button
      type="button"
      className="favorite-remove-icon"
      onClick={onClick}
      disabled={disabled}
      aria-label="Remove from favorites"
      title="Remove from favorites"
    >
      <Bookmark size={24} aria-hidden="true" />
    </button>
  );
}
