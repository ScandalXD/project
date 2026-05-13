import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { favoritesApi } from "../../api/favoritesApi";
import CocktailCard from "../../components/cocktails/CocktailCard";
import type { CocktailCardData, CocktailType } from "../../types/cocktail";

interface FavoriteItem extends CocktailCardData {
  cocktail_type: CocktailType;
}

export default function FavoritesPage() {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
      setError("Nie udało się pobrać ulubionych koktajli.");
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
          {items.map((cocktail) => (
            <Link
              key={`${cocktail.cocktail_type}-${cocktail.id}`}
              to={getDetailsPath(cocktail)}
              className="cocktail-card-link"
            >
              <CocktailCard cocktail={cocktail} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}