import type { FavoriteType } from "../api/favoritesApi";

export function normalizeFavorites(data: any, type: FavoriteType) {
  const list = Array.isArray(data) ? data : data.favorites || data.items || [];

  return list
    .filter((favorite: any) => {
      const favoriteType =
        favorite.cocktail_type || favorite.cocktailType || favorite.type;

      return favoriteType === type;
    })
    .map((favorite: any) =>
      String(
        favorite.cocktail_id ||
          favorite.cocktailId ||
          favorite.cocktailIdValue ||
          favorite.id
      )
    );
}
