import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";
import { Link } from "react-router-dom";

interface CocktailSocialActionsProps {
  commentsTo: string;
  isFavorite: boolean;
  isLiked: boolean;
  likesCount: number;
  onFavoriteToggle: () => void;
  onLikeToggle: () => void;
  onShare: () => void;
}

export default function CocktailSocialActions({
  commentsTo,
  isFavorite,
  isLiked,
  likesCount,
  onFavoriteToggle,
  onLikeToggle,
  onShare,
}: CocktailSocialActionsProps) {
  return (
    <div className="cocktail-social-actions">
      <button
        type="button"
        className={isLiked ? "is-active" : ""}
        onClick={onLikeToggle}
        aria-label="Like cocktail"
        title="Like"
      >
        <Heart
          size={24}
          fill={isLiked ? "currentColor" : "none"}
          aria-hidden="true"
        />
        <span>{likesCount}</span>
      </button>

      <Link to={commentsTo} aria-label="Open comments" title="Comments">
        <MessageCircle size={24} aria-hidden="true" />
      </Link>

      <button
        type="button"
        onClick={onShare}
        aria-label="Share cocktail"
        title="Share"
      >
        <Send size={24} aria-hidden="true" />
      </button>

      <button
        type="button"
        className={`cocktail-save-action ${isFavorite ? "is-active" : ""}`}
        onClick={onFavoriteToggle}
        aria-label={isFavorite ? "Remove from favorites" : "Save to favorites"}
        title={isFavorite ? "Saved" : "Save"}
      >
        <Bookmark size={24} aria-hidden="true" />
      </button>
    </div>
  );
}
