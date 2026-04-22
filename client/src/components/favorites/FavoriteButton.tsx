import { useEffect, useState } from "react";
import { favoritesApi, type FavoriteType } from "../../api/favoritesApi";

interface Props {
  cocktailId: string | number;
  type: FavoriteType;
}

export default function FavoriteButton({ cocktailId, type }: Props) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    const data = await favoritesApi.getFavorites();

    const exists = data.some(
      (f: any) =>
        String(f.id) === String(cocktailId) &&
        f.cocktail_type === type
    );

    setIsFavorite(exists);
  };

  useEffect(() => {
    load();
  }, [cocktailId, type]);

  const toggle = async () => {
    setIsLoading(true);

    try {
      if (isFavorite) {
        await favoritesApi.removeFavorite(cocktailId, type);
      } else {
        await favoritesApi.addFavorite(cocktailId, type);
      }

      await load();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={isLoading}
      style={{
        border: "none",
        background: isFavorite ? "#dc2626" : "#111827",
        color: "#ffffff",
        padding: "10px 14px",
        borderRadius: "10px",
        cursor: "pointer",
      }}
    >
      {isLoading ? "..." : isFavorite ? "❤️ Saved" : "🤍 Save"}
    </button>
  );
}