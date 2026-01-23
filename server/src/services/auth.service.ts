import bcrypt from "bcrypt";
import { db } from "../config/db";

export const registerUser = async (
  email: string,
  password: string,
  name: string
) => {
  const passwordHash = await bcrypt.hash(password, 10);

  const [result] = await db.query(
    "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)",
    [email, passwordHash, name]
  );

  return result;
};

export const loginUser = async (email: string) => {
  const [rows]: any = await db.query(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  return rows[0];
};
