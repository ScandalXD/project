import { useEffect, useState } from "react";
import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { cocktailsApi } from "../../api/cocktailsApi";
import { favoritesApi } from "../../api/favoritesApi";
import { likesApi } from "../../api/likesApi";
import { formatCocktailCategory } from "../../utils/formatCocktailCategory";
import { getImageUrl } from "../../utils/getImageUrl";
import { useAuth } from "../../hooks/useAuth";
import type { CatalogCocktail } from "../../types/cocktail";

import CocktailShareModal from "../../components/cocktails/CocktailShareModal";
import EmptyState from "../../components/ui/EmptyState";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";

function normalizeFavorites(data: any, type: "catalog" | "public") {
  const list = Array.isArray(data) ? data : data.favorites || data.items || [];

  return list
    .filter((f: any) => {
      const favoriteType = f.cocktail_type || f.cocktailType || f.type;
      return favoriteType === type;
    })
    .map((f: any) =>
      String(f.cocktail_id || f.cocktailId || f.cocktailIdValue || f.id)
    );
}

export default function CatalogPage() {
  const { isAuthenticated } = useAuth();

  const [items, setItems] = useState<CatalogCocktail[]>([]);
  const [filteredItems, setFilteredItems] = useState<CatalogCocktail[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const [favorites, setFavorites] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [likesCount, setLikesCount] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [shareCocktail, setShareCocktail] = useState<CatalogCocktail | null>(
    null
  );

  const load = async () => {
    try {
      const data = await cocktailsApi.getCatalogCocktails();
      setItems(data);

      const counts: Record<string, number> = {};

      await Promise.all(
        data.map(async (item) => {
          const id = String(item.id);
          counts[id] = await likesApi.getLikesCount("catalog", item.id);
        })
      );

      setLikesCount(counts);

      if (isAuthenticated) {
        const favs = await favoritesApi.getFavorites();
        setFavorites(normalizeFavorites(favs, "catalog"));

        const liked: string[] = [];

        await Promise.all(
          data.map(async (item) => {
            const id = String(item.id);
            const isLiked = await likesApi.isLikedByUser("catalog", item.id);

            if (isLiked) {
              liked.push(id);
            }
          })
        );

        setLikedIds(liked);
      } else {
        setFavorites([]);
        setLikedIds([]);
      }
    } catch {
      setError("Failed to load catalog.");
    }
  };

  useEffect(() => {
    load();
  }, [isAuthenticated]);

  useEffect(() => {
    let result = [...items];

    if (search.trim()) {
      const q = search.toLowerCase();

      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.ingredients.toLowerCase().includes(q)
      );
    }

    if (category !== "all") {
      result = result.filter((item) => item.category === category);
    }

    setFilteredItems(result);
  }, [items, search, category]);

  const toggleFavorite = async (cocktailId: string) => {
    const id = String(cocktailId);

    try {
      if (favorites.includes(id)) {
        await favoritesApi.removeFavorite(cocktailId, "catalog");
        setFavorites((prev) => prev.filter((itemId) => itemId !== id));
      } else {
        await favoritesApi.addFavorite(cocktailId, "catalog");
        setFavorites((prev) => [...prev, id]);
      }
    } catch {
      setError("Failed to update favorites.");
    }
  };

  const toggleLike = async (cocktailId: string) => {
    if (!isAuthenticated) return;

    const id = String(cocktailId);

    try {
      if (likedIds.includes(id)) {
        await likesApi.removeLike("catalog", cocktailId);

        setLikedIds((prev) => prev.filter((itemId) => itemId !== id));
        setLikesCount((prev) => ({
          ...prev,
          [id]: Math.max((prev[id] ?? 1) - 1, 0),
        }));
      } else {
        await likesApi.addLike("catalog", cocktailId);

        setLikedIds((prev) => [...prev, id]);
        setLikesCount((prev) => ({
          ...prev,
          [id]: (prev[id] ?? 0) + 1,
        }));
      }
    } catch {
      setError("Failed to update like.");
    }
  };

  return (
    <div className="page-container">
      <div className="catalog-header">
        <div>
          <h1>Cocktail Catalog</h1>
          <p className="muted-text">Explore official cocktail recipes.</p>
        </div>

        <div className="catalog-filters">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cocktails..."
          />

          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            <option value="Alkoholowy">Alcoholic</option>
            <option value="Bezalkoholowy">Non-alcoholic</option>
          </Select>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      {filteredItems.length === 0 ? (
        <EmptyState text="No cocktails found" />
      ) : (
        <div className="catalog-grid">
          {filteredItems.map((item) => {
            const id = String(item.id);

            return (
              <article key={item.id} className="cocktail-card">
                <Link
                  to={`/catalog/${item.id}`}
                  className="cocktail-card-main"
                >
                  {item.image && (
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      className="cocktail-card-image"
                    />
                  )}

                  <div className="cocktail-card-body">
                    <h3>{item.name}</h3>

                    <p className="muted-text">
                      {formatCocktailCategory(item.category)}
                    </p>

                    <p className="cocktail-preview">
                      {item.ingredients.length > 120
                        ? `${item.ingredients.slice(0, 120)}...`
                        : item.ingredients}
                    </p>
                  </div>
                </Link>

                {isAuthenticated && (
                  <div className="cocktail-social-actions">
                    <button
                      type="button"
                      className={likedIds.includes(id) ? "is-active" : ""}
                      onClick={() => toggleLike(String(item.id))}
                      aria-label="Like cocktail"
                      title="Like"
                    >
                      <Heart
                        size={24}
                        fill={likedIds.includes(id) ? "currentColor" : "none"}
                        aria-hidden="true"
                      />
                      <span>{likesCount[id] ?? 0}</span>
                    </button>

                    <Link
                      to={`/catalog/${item.id}`}
                      aria-label="Open comments"
                      title="Comments"
                    >
                      <MessageCircle size={24} aria-hidden="true" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => setShareCocktail(item)}
                      aria-label="Share cocktail"
                      title="Share"
                    >
                      <Send size={24} aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      className={`cocktail-save-action ${
                        favorites.includes(id) ? "is-active" : ""
                      }`}
                      onClick={() => toggleFavorite(String(item.id))}
                      aria-label={
                        favorites.includes(id)
                          ? "Remove from favorites"
                          : "Save to favorites"
                      }
                      title={favorites.includes(id) ? "Saved" : "Save"}
                    >
                      <Bookmark size={24} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {shareCocktail && (
        <CocktailShareModal
          cocktailId={shareCocktail.id}
          cocktailName={shareCocktail.name}
          cocktailType="catalog"
          detailsPath={`/catalog/${shareCocktail.id}`}
          onClose={() => setShareCocktail(null)}
        />
      )}
    </div>
  );
}
