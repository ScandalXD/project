import { useEffect, useState } from "react";
import { Bookmark, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { favoritesApi, type FavoriteType } from "../../api/favoritesApi";
import CocktailCard from "../../components/cocktails/CocktailCard";
import UserAvatar from "../../components/ui/UserAvatar";
import type { CocktailCardData, CocktailType } from "../../types/cocktail";
import { formatCocktailCategory } from "../../utils/formatCocktailCategory";
import { getImageUrl } from "../../utils/getImageUrl";

interface FavoriteItem extends CocktailCardData {
  cocktail_type: CocktailType;
}

type FavoriteFilter = "all" | "public" | "catalog";
type FavoriteCategoryFilter = "all" | "Alkoholowy" | "Bezalkoholowy";

const getFavoriteKey = (item: FavoriteItem) => `${item.cocktail_type}-${item.id}`;

export default function FavoritesPage() {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<FavoriteFilter>("all");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<FavoriteCategoryFilter>("all");
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
    const key = getFavoriteKey(item);

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
          (favorite) => getFavoriteKey(favorite) !== key
        )
      );
    } catch {
      setError("Failed to remove favorite.");
    } finally {
      setRemovingId(null);
    }
  };

  const matchesSearchAndCategory = (item: FavoriteItem) => {
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch =
      !normalizedSearch || item.name.toLowerCase().includes(normalizedSearch);
    const matchesCategory = category === "all" || item.category === category;

    return matchesSearch && matchesCategory;
  };

  const filteredItems = items.filter(matchesSearchAndCategory);
  const catalogItems = filteredItems.filter(
    (item) => item.cocktail_type === "catalog",
  );
  const publicItems = filteredItems.filter(
    (item) => item.cocktail_type === "public",
  );
  const visibleItems = filteredItems.filter((item) => {
    if (activeFilter === "all") return true;
    return item.cocktail_type === activeFilter;
  });

  const favoriteFilters: Array<{
    key: FavoriteFilter;
    label: string;
    count: number;
  }> = [
    { key: "all", label: "All", count: filteredItems.length },
    { key: "public", label: "Public", count: publicItems.length },
    { key: "catalog", label: "Catalog", count: catalogItems.length },
  ];

  const renderRemoveButton = (cocktail: FavoriteItem) => {
    const key = getFavoriteKey(cocktail);

    return (
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
    );
  };

  const renderPublicFavorite = (cocktail: FavoriteItem) => {
    const authorName = cocktail.author_nickname || "User";

    return (
      <div
        key={getFavoriteKey(cocktail)}
        className="favorite-card-shell"
      >
        <article className="cocktail-card favorite-public-card">
          <div className="public-post-header">
            <Link
              to={
                cocktail.author_id
                  ? `/authors/${cocktail.author_id}`
                  : getDetailsPath(cocktail)
              }
              className="public-post-author"
            >
              <UserAvatar
                nickname={authorName}
                avatar={cocktail.author_avatar}
                className="public-post-avatar"
              />
              <span>
                <strong>{authorName}</strong>
              </span>
            </Link>
          </div>

          <Link to={getDetailsPath(cocktail)} className="cocktail-card-main">
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
                <span className="category-badge">
                  {formatCocktailCategory(cocktail.category)}
                </span>
              </div>

              <p className="cocktail-preview">{cocktail.ingredients}</p>
            </div>
          </Link>
        </article>

        {renderRemoveButton(cocktail)}
      </div>
    );
  };

  const renderCatalogFavorite = (cocktail: FavoriteItem) => (
    <div
      key={getFavoriteKey(cocktail)}
      className="favorite-card-shell"
    >
      <Link to={getDetailsPath(cocktail)} className="cocktail-card-link">
        <CocktailCard cocktail={cocktail} />
      </Link>

      {renderRemoveButton(cocktail)}
    </div>
  );

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
    <div className="page-container favorites-page">
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
        <div className="favorites-sections">
          <div className="favorites-toolbar">
            <div className="favorites-filter-tabs" aria-label="Favorite filters">
              {favoriteFilters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  className={
                    activeFilter === filter.key
                      ? "favorites-filter-tab favorites-filter-tab-active"
                      : "favorites-filter-tab"
                  }
                  onClick={() => setActiveFilter(filter.key)}
                >
                  <span>{filter.label}</span>
                  <strong>{filter.count}</strong>
                </button>
              ))}
            </div>

            <div className="favorites-filter-controls">
              <label className="favorites-search-control">
                <Search size={18} aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search favorites"
                />
              </label>

              <select
                className="app-select favorites-category-select"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as FavoriteCategoryFilter)
                }
              >
                <option value="all">All categories</option>
                <option value="Alkoholowy">Alcoholic</option>
                <option value="Bezalkoholowy">Non-alcoholic</option>
              </select>
            </div>
          </div>

          {visibleItems.length === 0 ? (
            <div className="empty-state">No cocktails in this section</div>
          ) : (
            <div className="catalog-grid">
              {visibleItems.map((cocktail) =>
                cocktail.cocktail_type === "public"
                  ? renderPublicFavorite(cocktail)
                  : renderCatalogFavorite(cocktail),
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
