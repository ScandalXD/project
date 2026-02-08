import { Request, Response } from "express";
import { registerUser, loginUser } from "../services/auth.service";
import { generateToken } from "../services/token.service";

interface RegisterBody {
  email: string;
  password: string;
  name: string;
}

interface LoginBody {
  email: string;
  password: string;
}

export const register = async (
  req: Request<{}, {}, RegisterBody>,
  res: Response
) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const user = await registerUser(email, password, name);

    const token = generateToken({
      id: user.id,
      email: user.email,
    });

    res.status(201).json({ token });
  } catch {
    res.status(400).json({ message: "Registration failed" });
  }
};

export const login = async (
  req: Request<{}, {}, LoginBody>,
  res: Response
) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing credentials" });
  }

  try {
    const user = await loginUser(email, password);

    const token = generateToken({
      id: user.id,
      email: user.email,
    });

    res.json({ token });
  } catch {
    res.status(401).json({ message: "Invalid credentials" });
  }
};
