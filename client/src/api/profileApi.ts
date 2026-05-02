import { api } from "./axios";
import type { ChangePasswordRequest ,UpdateProfileRequest, User } from "../types/user";

export const profileApi = {
  async getProfile(): Promise<User> {
    const response = await api.get<User>("/profile");
    return response.data;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<{ user: User; token?: string }> {
    const response = await api.put<{ user: User; token?: string }>("/profile", data);
    return response.data;
  },

  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    const response = await api.put<{ message: string }>("/profile/password", data);
    return response.data
  },
};