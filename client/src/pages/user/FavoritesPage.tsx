import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { favoritesApi } from "../../api/favoritesApi";
import CocktailCard from "../../components/cocktails/CocktailCard";

export default function FavoritesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const favorites = await favoritesApi.getFavorites();

      const mapped = favorites.map((item: any) => ({
        ...item,
        type: item.cocktail_type,
      }));

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

  const getDetailsPath = (item: any) => {
    if (item.cocktail_type === "catalog") {
      return `/catalog/${item.id}`;
    }

    if (item.cocktail_type === "public") {
      return `/public-cocktails/${item.id}`;
    }

    return "/";
  };

  if (isLoading) {
    return <div>Loading favorites...</div>;
  }

  if (error) {
    return <div style={{ color: "#dc2626" }}>{error}</div>;
  }

  return (
    <div>
      <h1>Favorites</h1>

      {items.length === 0 ? (
        <p>No favorites yet</p>
      ) : (
        <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
          {items.map((c) => (
            <Link
              key={`${c.cocktail_type}-${c.id}`}
              to={getDetailsPath(c)}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <CocktailCard cocktail={c} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}