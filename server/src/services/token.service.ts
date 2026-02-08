import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

export const generateToken = (payload: { id: number; email: string }) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
};
