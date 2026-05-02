import { db } from "../config/db";
import bcrypt from "bcrypt";
import { User } from "../models/User.model";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const registerUser = async (
  email: string,
  password: string,
  nickname: string
): Promise<User> => {
  const [existingUsers] = await db.query<RowDataPacket[]>(
    "SELECT id FROM users WHERE email = ? OR nickname = ?",
    [email, nickname]
  );

  if (existingUsers.length > 0) {
    throw new Error("EMAIL_OR_NICKNAME_ALREADY_EXISTS");
  }

  const hash = await bcrypt.hash(password, 10);

  const [result] = await db.query<ResultSetHeader>(
    "INSERT INTO users (email, password_hash, nickname, role) VALUES (?, ?, ?, ?)",
    [email, hash, nickname, "user"]
  );

  return {
    id: result.insertId,
    email,
    nickname,
    password_hash: hash,
    role: "user",
    created_at: new Date().toISOString(),
    is_active: true,
  };
};

export const loginUser = async (
  email: string,
  password: string
): Promise<User> => {
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  const users = rows as User[];

  if (users.length === 0) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const user = users[0];

  if (!user.is_active) {
    throw new Error("ACCOUNT_DEACTIVATED");
  }

  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  return user;
};