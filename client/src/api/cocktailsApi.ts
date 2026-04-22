import { api } from "./axios";
import type {
  CatalogCocktail,
  PublicCocktail,
  UserCocktail,
  CreateCocktailRequest,
} from "../types/cocktail";

export const cocktailsApi = {
  async getCatalogCocktails(): Promise<CatalogCocktail[]> {
    const response = await api.get<CatalogCocktail[]>("/catalog");
    return response.data;
  },

  async getPublicCocktails(): Promise<PublicCocktail[]> {
    const response = await api.get<PublicCocktail[]>("/public");
    return response.data;
  },

  async getMyCocktails(): Promise<UserCocktail[]> {
    const response = await api.get<UserCocktail[]>("/my");
    return response.data;
  },

  async createCocktail(data: CreateCocktailRequest): Promise<{
    message: string;
    cocktailId: number;
  }> {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("category", data.category);
    formData.append("ingredients", data.ingredients);
    formData.append("instructions", data.instructions);

    if (data.image) {
      formData.append("image", data.image);
    }

    const response = await api.post("/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  async publishCocktail(id: number): Promise<{ message: string }> {
    const response = await api.post(`/${id}/publish`);
    return response.data;
  },

  async deleteCocktail(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/${id}`);
    return response.data;
  },

  async updateCocktail(
    id: number,
    data: CreateCocktailRequest,
  ): Promise<{ message: string }> {
    const formData = new FormData();

    formData.append("name", data.name);
    formData.append("category", data.category);
    formData.append("ingredients", data.ingredients);
    formData.append("instructions", data.instructions);

    if (data.image) {
      formData.append("image", data.image);
    } else if (data.currentImage) {
      formData.append("image", data.currentImage);
    }

    const response = await api.put(`/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  async getCocktailById(id: number) {
    const response = await api.get(`/my/${id}`);
    return response.data;
  },
};
