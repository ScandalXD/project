import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { generateToken } from "../services/token.service";
import { registerUser, loginUser } from "../services/auth.service";

export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  await registerUser(email, password, name);

  res.status(201).json({ message: "User registered" });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await loginUser(email);
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = generateToken({ id: user.id, email: user.email });

  res.json({ token });
};
