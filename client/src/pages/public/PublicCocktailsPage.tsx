import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cocktailsApi } from "../../api/cocktailsApi";
import { favoritesApi } from "../../api/favoritesApi";
import { likesApi } from "../../api/likesApi";
import { formatCocktailCategory } from "../../utils/formatCocktailCategory";
import { getImageUrl } from "../../utils/getImageUrl";
import { useAuth } from "../../hooks/useAuth";
import type { PublicCocktail } from "../../types/cocktail";

import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Input from "../../components/ui/Input";

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

export default function PublicCocktailsPage() {
  const { isAuthenticated } = useAuth();

  const [items, setItems] = useState<PublicCocktail[]>([]);
  const [filteredItems, setFilteredItems] = useState<PublicCocktail[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const [favorites, setFavorites] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [likesCount, setLikesCount] = useState<Record<string, number>>({});
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await cocktailsApi.getPublicCocktails();
      setItems(data);

      const counts: Record<string, number> = {};

      await Promise.all(
        data.map(async (item) => {
          const id = String(item.id);
          counts[id] = await likesApi.getLikesCount("public", item.id);
        })
      );

      setLikesCount(counts);

      if (isAuthenticated) {
        const favs = await favoritesApi.getFavorites();
        setFavorites(normalizeFavorites(favs, "public"));

        const liked: string[] = [];

        await Promise.all(
          data.map(async (item) => {
            const id = String(item.id);
            const isLiked = await likesApi.isLikedByUser("public", item.id);

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
      setError("Failed to load public cocktails.");
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
          item.ingredients.toLowerCase().includes(q) ||
          (item.author_nickname ?? "").toLowerCase().includes(q)
      );
    }

    if (category !== "all") {
      result = result.filter((item) => item.category === category);
    }

    setFilteredItems(result);
  }, [items, search, category]);

  const toggleFavorite = async (cocktailId: number) => {
    const id = String(cocktailId);

    try {
      if (favorites.includes(id)) {
        await favoritesApi.removeFavorite(cocktailId, "public");
        setFavorites((prev) => prev.filter((itemId) => itemId !== id));
      } else {
        await favoritesApi.addFavorite(cocktailId, "public");
        setFavorites((prev) => [...prev, id]);
      }
    } catch {
      setError("Failed to update favorites.");
    }
  };

  const toggleLike = async (cocktailId: number) => {
    if (!isAuthenticated) return;

    const id = String(cocktailId);

    try {
      if (likedIds.includes(id)) {
        await likesApi.removeLike("public", cocktailId);

        setLikedIds((prev) => prev.filter((itemId) => itemId !== id));
        setLikesCount((prev) => ({
          ...prev,
          [id]: Math.max((prev[id] ?? 1) - 1, 0),
        }));
      } else {
        await likesApi.addLike("public", cocktailId);

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
          <h1>Public Cocktails</h1>
          <p className="muted-text">
            Cocktails published by the user community.
          </p>
        </div>

        <div className="catalog-filters">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cocktails..."
          />

          <select
            className="app-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            <option value="Alkoholowy">Alcoholic</option>
            <option value="Bezalkoholowy">Non-alcoholic</option>
          </select>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      {filteredItems.length === 0 ? (
        <EmptyState text="No public cocktails found" />
      ) : (
        <div className="catalog-grid">
          {filteredItems.map((item) => {
            const id = String(item.id);

            return (
              <div key={item.id} className="cocktail-card">
                {item.image && (
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    className="cocktail-card-image"
                  />
                )}

                <div className="cocktail-card-body">
                  <div className="cocktail-card-title-row">
                    <h3>{item.name}</h3>
                    <p className="muted-text">Author: {item.author_nickname}</p>
                  </div>

                  <p className="muted-text">
                    {formatCocktailCategory(item.category)}
                  </p>

                  <p className="cocktail-preview">
                    {item.ingredients.length > 120
                      ? `${item.ingredients.slice(0, 120)}...`
                      : item.ingredients}
                  </p>

                  <div className="cocktail-card-actions">
                    <Link
                      to={`/public-cocktails/${item.id}`}
                      className="admin-create-link"
                    >
                      View details
                    </Link>

                    {isAuthenticated && (
                      <>
                        <Button
                          variant={
                            likedIds.includes(id) ? "danger" : "secondary"
                          }
                          onClick={() => toggleLike(Number(item.id))}
                        >
                          ❤️ {likesCount[id] ?? 0}
                        </Button>

                        <Button
                          variant={
                            favorites.includes(id) ? "danger" : "secondary"
                          }
                          onClick={() => toggleFavorite(Number(item.id))}
                        >
                          {favorites.includes(id) ? "♥ Saved" : "♡ Save"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
