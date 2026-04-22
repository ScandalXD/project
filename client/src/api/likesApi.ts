import { api } from "./axios";

export type CocktailLikeType = "catalog" | "public";

export const likesApi = {
  async getLikesCount(
    cocktailType: CocktailLikeType,
    cocktailId: string | number
  ): Promise<number> {
    const response = await api.get<{ count: number }>(
      `/likes/${cocktailType}/${cocktailId}`
    );
    return response.data.count;
  },

  async isLikedByUser(
    cocktailType: CocktailLikeType,
    cocktailId: string | number
  ): Promise<boolean> {
    const response = await api.get<{ liked: boolean }>(
      `/likes/${cocktailType}/${cocktailId}/me`
    );
    return response.data.liked;
  },

  async addLike(
    cocktailType: CocktailLikeType,
    cocktailId: string | number
  ): Promise<{ message: string }> {
    const response = await api.post("/likes", {
      cocktailId: String(cocktailId),
      cocktailType,
    });
    return response.data;
  },

  async removeLike(
    cocktailType: CocktailLikeType,
    cocktailId: string | number
  ): Promise<{ message: string }> {
    const response = await api.delete(`/likes/${cocktailType}/${cocktailId}`);
    return response.data;
  },
};