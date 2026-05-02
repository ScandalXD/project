export type UserRole = "user" | "admin" | "superadmin";

export interface User {
    id: number;
    nickname: string;
    email: string;
    role: UserRole;
    is_active?: boolean;
    created_at?: string;
}

export interface UpdateProfileRequest {
    nickname?: string;
    email?: string
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}