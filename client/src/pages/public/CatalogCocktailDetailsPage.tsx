import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { cocktailsApi } from "../../api/cocktailsApi";
import { likesApi } from "../../api/likesApi";
import { getImageUrl } from "../../utils/getImageUrl";
import { useAuth } from "../../hooks/useAuth";
import CommentList from "../../components/comments/CommentList";
import FavoriteButton from "../../components/favorites/FavoriteButton";
import type { CatalogCocktail } from "../../types/cocktail";

export default function CatalogCocktailDetailsPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();

  const [cocktail, setCocktail] = useState<CatalogCocktail | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [error, setError] = useState("");

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

  const loadLikes = async () => {
    if (!id) {
      return;
    }

    try {
      const count = await likesApi.getLikesCount("catalog", id);
      setLikesCount(count);

      if (isAuthenticated) {
        const liked = await likesApi.isLikedByUser("catalog", id);
        setIsLiked(liked);
      } else {
        setIsLiked(false);
      }
    } catch {}
  };

  useEffect(() => {
    loadCocktail();
  }, [id]);

  useEffect(() => {
    loadLikes();
  }, [id, isAuthenticated]);

  const handleToggleLike = async () => {
    if (!isAuthenticated || !id) {
      return;
    }

    if (isLiked) {
      await likesApi.removeLike("catalog", id);
    } else {
      await likesApi.addLike("catalog", id);
    }

    await loadLikes();
  };

  if (error) {
    return <div style={{ color: "#dc2626" }}>{error}</div>;
  }

  if (!cocktail) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {cocktail.image && (
        <div
          style={{
            width: "100%",
            height: "420px",
            background: "#e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        >
          <img
            src={getImageUrl(cocktail.image)}
            alt={cocktail.name}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              display: "block",
            }}
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

      <button
        onClick={handleToggleLike}
        disabled={!isAuthenticated}
        style={{
          border: "none",
          background: isLiked ? "#dc2626" : "#111827",
          color: "#ffffff",
          padding: "10px 14px",
          borderRadius: "10px",
          cursor: isAuthenticated ? "pointer" : "not-allowed",
        }}
      >
        ❤️ {likesCount}
      </button>
      <FavoriteButton cocktailId={cocktail.id} type="catalog" />

      <CommentList cocktailId={cocktail.id} type="catalog" />
    </div>
  );
}
