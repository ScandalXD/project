import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { UserRole } from "../models/User.model";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface JwtPayload {
  id: number;
  email: string;
  role: UserRole;
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};