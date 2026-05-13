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
      (favorite: any) =>
        String(favorite.id) === String(cocktailId) &&
        favorite.cocktail_type === type
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
      type="button"
      onClick={toggle}
      disabled={isLoading}
      className={`favorite-button ${
        isFavorite ? "favorite-button-active" : ""
      }`}
    >
      {isLoading ? "..." : isFavorite ? "❤️ Saved" : "🤍 Save"}
    </button>
  );
}