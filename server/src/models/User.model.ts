export type UserRole = "user" | "admin";

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  nickname: string;
  role: UserRole;
  created_at: string;
}