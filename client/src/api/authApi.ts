import { api } from "./axios";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from "../types/auth";
import type { User } from "../types/user";

export const authApi = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/register", data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", data);
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get<User>("/profile");
    return response.data;
  },
};