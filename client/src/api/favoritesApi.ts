import { api } from "./axios";

export type FavoriteType = "catalog" | "public";

export const favoritesApi = {
  async getFavorites() {
    const response = await api.get("/favorites");
    return response.data;
  },

  async addFavorite(cocktailId: string | number, type: FavoriteType) {
    const response = await api.post("/favorites", {
      cocktailId: String(cocktailId),
      cocktail_type: type,
    });
    return response.data;
  },

  async removeFavorite(cocktailId: string | number, type: FavoriteType) {
    const response = await api.delete(`/favorites/${cocktailId}/${type}`);
    return response.data;
  },
};