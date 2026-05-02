export type UserRole = "user" | "admin" | "superadmin";

export interface User {
  id: number;
  email: string;
  password_hash: string;
  nickname: string;
  role: UserRole;
  created_at: string;
  is_active: boolean;
}