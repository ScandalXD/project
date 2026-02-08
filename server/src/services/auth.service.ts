import { db } from "../config/db";
import bcrypt from "bcrypt";
import { User } from "../models/User.model";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const registerUser = async (
  email: string,
  password: string,
  name: string
): Promise<User> => {
  const hash = await bcrypt.hash(password, 10);

  const [result] = await db.query<ResultSetHeader>(
    "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)",
    [email, hash, name]
  );

  return {
    id: result.insertId,
    email,
    name,
    password_hash: hash,
    created_at: new Date().toISOString(),
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
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  return user;
};
