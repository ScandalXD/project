import { useEffect, useState } from "react";
import { cocktailsApi } from "../../api/cocktailsApi";
import { favoritesApi } from "../../api/favoritesApi";
import { likesApi } from "../../api/likesApi";
import { useAuth } from "../../hooks/useAuth";
import type { CatalogCocktail } from "../../types/cocktail";
import { normalizeFavorites } from "../../utils/normalizeFavorites";

import CocktailCard from "../../components/cocktails/CocktailCard";
import CocktailSocialActions from "../../components/cocktails/CocktailSocialActions";
import CocktailShareModal from "../../components/cocktails/CocktailShareModal";
import EmptyState from "../../components/ui/EmptyState";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";

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
              <CocktailCard
                key={item.id}
                cocktail={{ ...item, type: "catalog" }}
                previewLimit={120}
                showAuthor={false}
                showIngredientsLabel={false}
                showInstructions={false}
                to={`/catalog/${item.id}`}
                actions={
                  isAuthenticated ? (
                    <CocktailSocialActions
                      commentsTo={`/catalog/${item.id}`}
                      isFavorite={favorites.includes(id)}
                      isLiked={likedIds.includes(id)}
                      likesCount={likesCount[id] ?? 0}
                      onFavoriteToggle={() => toggleFavorite(String(item.id))}
                      onLikeToggle={() => toggleLike(String(item.id))}
                      onShare={() => setShareCocktail(item)}
                    />
                  ) : null
                }
              />
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
