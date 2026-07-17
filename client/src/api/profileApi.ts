import { api } from "./axios";
import type { ChangePasswordRequest, UpdateProfileRequest, User } from "../types/user";

export const profileApi = {
  async getProfile(): Promise<User> {
    const response = await api.get<User>("/profile");
    return response.data;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<{ user: User; token?: string }> {
    const response = await api.put<{ user: User; token?: string }>("/profile", data);
    return response.data;
  },

  async updateAvatar(file: File): Promise<{ user: User }> {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await api.put<{ user: User }>("/profile/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    const response = await api.put<{ message: string }>("/profile/password", data);
    return response.data
  },

  async deleteProfile() {
    const response = await api.delete("/profile");
    return response.data;
  },
};
