import { Request, Response } from "express";
import { db } from "../config/db";
import bcrypt from "bcrypt";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { User } from "../models/User.model";
import { generateToken } from "../services/token.service";

interface UpdateProfileBody {
  nickname?: string;
  email?: string;
}

interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export const getProfile = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const userId = Number(req.user.id);

    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT id, email, nickname, role, created_at, is_active FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0] as Omit<User, "password_hash">;

    res.json(user);
  } catch {
    res.status(500).json({ message: "Failed to load profile" });
  }
};

export const updateProfile = async (
  req: Request<{}, {}, UpdateProfileBody>,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const userId = Number(req.user.id);
    const { nickname, email } = req.body;

    if (nickname === undefined && email === undefined) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    if (nickname !== undefined) {
      const [existingNickname] = await db.query<RowDataPacket[]>(
        "SELECT id FROM users WHERE nickname = ? AND id != ?",
        [nickname, userId]
      );

      if (existingNickname.length > 0) {
        return res.status(400).json({ message: "Nickname already taken" });
      }
    }

    if (email !== undefined) {
      const [existingEmail] = await db.query<RowDataPacket[]>(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, userId]
      );

      if (existingEmail.length > 0) {
        return res.status(400).json({ message: "Email already taken" });
      }
    }

    const fields: string[] = [];
    const values: Array<string | number> = [];

    if (nickname !== undefined) {
      fields.push("nickname = ?");
      values.push(nickname);
    }

    if (email !== undefined) {
      fields.push("email = ?");
      values.push(email);
    }

    values.push(userId);

    await db.query<ResultSetHeader>(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT id, email, nickname, role, created_at, is_active FROM users WHERE id = ?",
      [userId]
    );

    const updatedUser = rows[0] as Omit<User, "password_hash">;

    const token = generateToken({
      id: Number(updatedUser.id),
      email: updatedUser.email,
      role: updatedUser.role,
    });

    res.json({
      message: "Profile updated",
      token,
      user: updatedUser,
    });
  } catch (error) {
    console.error("updateProfile error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

export const changePassword = async (
  req: Request<{}, {}, ChangePasswordBody>,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const userId = Number(req.user.id);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long",
      });
    }

    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT id, password_hash FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0] as { id: number; password_hash: string };

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.password_hash
    );

    if (isSamePassword) {
      return res.status(400).json({
        message: "New password must be different from current password",
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await db.query<ResultSetHeader>(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [newPasswordHash, userId]
    );

    res.json({ message: "Password updated" });
  } catch (error) {
    console.error("changePassword error:", error);
    res.status(500).json({ message: "Failed to update password" });
  }
};

export const deleteProfile = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const userId = Number(req.user.id);

    const [userRows] = await db.query<RowDataPacket[]>(
      "SELECT id, role FROM users WHERE id = ?",
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentUser = userRows[0] as {
      id: number;
      role: "user" | "admin" | "superadmin";
    };

    if (currentUser.role === "superadmin") {
      return res.status(409).json({
        message: "Superadmin account cannot be deleted from profile",
      });
    }

    if (currentUser.role === "admin") {
      const [adminRows] = await db.query<RowDataPacket[]>(
        "SELECT COUNT(*) AS count FROM users WHERE role IN ('admin', 'superadmin')"
      );

      const adminCount = Number(adminRows[0].count);

      if (adminCount === 1) {
        return res.status(409).json({
          message: "You cannot delete the last admin account",
        });
      }
    }

    await db.query<ResultSetHeader>("DELETE FROM users WHERE id = ?", [userId]);

    res.json({ message: "Account deleted" });
  } catch (error) {
    console.error("deleteProfile error:", error);
    res.status(500).json({ message: "Failed to delete account" });
  }
};