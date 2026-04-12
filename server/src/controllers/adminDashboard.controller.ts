import { Request, Response } from "express";
import {
  getAllUsers,
  getSystemStats,
} from "../services/adminDashboard.service";
import { ServiceError } from "../services/cocktail.service";

const handleError = (res: Response, err: unknown) => {
  if (err instanceof ServiceError) {
    return res.status(err.status).json({ message: err.message });
  }

  if (err instanceof Error) {
    return res.status(400).json({ message: err.message });
  }

  return res.status(500).json({ message: "Internal server error" });
};

export const getAllUsersHandler = async (_req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (e) {
    handleError(res, e);
  }
};

export const getSystemStatsHandler = async (_req: Request, res: Response) => {
  try {
    const stats = await getSystemStats();
    res.json(stats);
  } catch (e) {
    handleError(res, e);
  }
};