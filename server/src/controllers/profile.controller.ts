import { Request, Response } from "express";
import { db } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { User } from "../models/User.model";
import { generateToken } from "../services/token.service";

interface UpdateProfileBody {
  name?: string;
  nickname?: string;
}

export const getProfile = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const userId = Number(req.user.id);

    if (!Number.isInteger(userId)) {
      return res.status(401).json({ message: "Invalid user id in token" });
    }

    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT id, email, name, nickname, role, created_at FROM users WHERE id = ?",
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
    const user = req.user;
    const userId = Number(user.id);

    if (!Number.isInteger(userId)) {
      return res.status(401).json({ message: "Invalid user id in token" });
    }

    const { name, nickname } = req.body;

    if (name === undefined && nickname === undefined) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    if (nickname !== undefined) {
      const [existing] = await db.query<RowDataPacket[]>(
        "SELECT id FROM users WHERE nickname = ? AND id != ?",
        [nickname, userId]
      );

      if (existing.length > 0) {
        return res.status(400).json({ message: "Nickname already taken" });
      }
    }

    const fields: string[] = [];
    const values: Array<string | number> = [];

    if (name !== undefined) {
      fields.push("name = ?");
      values.push(name);
    }

    if (nickname !== undefined) {
      fields.push("nickname = ?");
      values.push(nickname);
    }

    values.push(userId);

    const [result] = await db.query<ResultSetHeader>(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT id, email, name, nickname, role, created_at FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

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