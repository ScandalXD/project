export type UserRole = "user" | "admin";

export interface User {
    id: number;
    name: string;
    nickname: string;
    email: string;
    role: UserRole;
    is_active?: boolean;
    created_at?: string;
}

export interface UpdateProfileRequest {
    name: string;
    nickname: string;
    email?: string
}