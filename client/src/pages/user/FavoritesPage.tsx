import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { Link } from "react-router-dom";
import { favoritesApi, type FavoriteType } from "../../api/favoritesApi";
import CocktailCard from "../../components/cocktails/CocktailCard";
import type { CocktailCardData, CocktailType } from "../../types/cocktail";

interface FavoriteItem extends CocktailCardData {
  cocktail_type: CocktailType;
}

export default function FavoritesPage() {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = async () => {
    try {
      setError("");

      const favorites = await favoritesApi.getFavorites();

      const mapped = favorites
        .map((item: FavoriteItem) => ({
          ...item,
          type: item.cocktail_type,
        }))
        .filter((item: FavoriteItem) => item.id && item.name);

      setItems(mapped);
    } catch {
      setError("Failed to load favorite cocktails.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const getDetailsPath = (item: FavoriteItem) => {
    if (item.cocktail_type === "catalog") {
      return `/catalog/${item.id}`;
    }

    if (item.cocktail_type === "public") {
      return `/public-cocktails/${item.id}`;
    }

    return "/";
  };

  const removeFavorite = async (item: FavoriteItem) => {
    const key = `${item.cocktail_type}-${item.id}`;

    if (item.cocktail_type !== "catalog" && item.cocktail_type !== "public") {
      return;
    }

    try {
      setError("");
      setRemovingId(key);

      await favoritesApi.removeFavorite(
        item.id,
        item.cocktail_type as FavoriteType
      );

      setItems((prev) =>
        prev.filter(
          (favorite) =>
            `${favorite.cocktail_type}-${favorite.id}` !== key
        )
      );
    } catch {
      setError("Failed to remove favorite.");
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="empty-state">Loading favorites...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="empty-state error-text">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1>Favorites</h1>
          <p className="muted-text">
            Your saved catalog and public cocktails.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">No favorites yet</div>
      ) : (
        <div className="catalog-grid">
          {items.map((cocktail) => {
            const key = `${cocktail.cocktail_type}-${cocktail.id}`;

            return (
              <div key={key} className="favorite-card-shell">
                <Link to={getDetailsPath(cocktail)} className="cocktail-card-link">
                  <CocktailCard cocktail={cocktail} />
                </Link>

                <button
                  type="button"
                  className="favorite-remove-icon"
                  onClick={() => removeFavorite(cocktail)}
                  disabled={removingId === key}
                  aria-label="Remove from favorites"
                  title="Remove from favorites"
                >
                  <Bookmark size={24} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
