import { api } from "./axios";

export const adminApi = {
  async getPendingCocktails() {
    const res = await api.get("/admin/moderation/pending");
    return res.data;
  },

  async approveCocktail(id: number) {
    const res = await api.post(`/admin/moderation/${id}/approve`);
    return res.data;
  },

  async rejectCocktail(id: number, reason: string) {
    const res = await api.post(`/admin/moderation/${id}/reject`, { reason });
    return res.data;
  },

  async getUsers() {
    const res = await api.get("/admin/users");
    return res.data;
  },

  async deactivateUser(id: number) {
    const res = await api.patch(`/admin/users/${id}/deactivate`);
    return res.data;
  },

  async reactivateUser(id: number) {
    const res = await api.patch(`/admin/users/${id}/reactivate`);
    return res.data;
  },

  async updateUserRole(userId: number, role: "user" | "admin" | "superadmin") {
    return api.patch(`/admin/users/${userId}/role`, { role });
  },

  async deleteCatalogCocktail(id: string) {
    const res = await api.delete(`/admin/catalog/${id}`);
    return res.data;
  },

  async getStats() {
    const res = await api.get("/admin/stats");
    return res.data;
  },

  async getCatalogCocktailById(id: string)  {
    const res = await api.get(`/catalog`);
    const items = res.data;
    return items.find((item: any) => item.id === id);
  },

  async getComments() {
    const res = await api.get("/admin/comments");
    return res.data;
  },

  async createCatalogCocktail(data: {
  id: string;
  name: string;
  category: "Alkoholowy" | "Bezalkoholowy";
  ingredients: string;
  instructions: string;
  image?: File | null;
}) {
  const formData = new FormData();

  formData.append("id", data.id);
  formData.append("name", data.name);
  formData.append("category", data.category);
  formData.append("ingredients", data.ingredients);
  formData.append("instructions", data.instructions);

  if (data.image) {
    formData.append("image", data.image);
  }

  const res = await api.post("/admin/catalog", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
},

async updateCatalogCocktail(
  id: string,
  data: {
    name: string;
    category: "Alkoholowy" | "Bezalkoholowy";
    ingredients: string;
    instructions: string;
    image?: File | null;
    currentImage?: string | null;
  }
) {
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

  const res = await api.put(`/admin/catalog/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
},
};