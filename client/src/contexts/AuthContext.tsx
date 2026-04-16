import { createContext, useEffect, useState, type ReactNode } from "react";
import { authApi } from "../api/authApi";
import { authStorage } from "../services/authStorage";
import type {
  AuthContextValue,
  LoginRequest,
  RegisterRequest,
} from "../types/auth";
import type { User } from "../types/user";

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(authStorage.getUser());
  const [token, setToken] = useState<string | null>(authStorage.getToken());
  const [isLoading, setIsLoading] = useState(true);

  const setAuthData = (newToken: string, newUser: User) => {
    authStorage.setToken(newToken);
    authStorage.setUser(newUser);
    setToken(newToken);
    setUser(newUser);
  };

  const login = async (data: LoginRequest) => {
    const response = await authApi.login(data);
    setAuthData(response.token, response.user);
  };

  const register = async (data: RegisterRequest) => {
    const response = await authApi.register(data);
    setAuthData(response.token, response.user);
  };

  const logout = () => {
    authStorage.clear();
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = authStorage.getToken();
      const savedUser = authStorage.getUser();

      if (!savedToken || !savedUser) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await authApi.getProfile();
        setUser(profile);
        authStorage.setUser(profile);
      } catch {
        authStorage.clear();
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    register,
    logout,
    setAuthData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}