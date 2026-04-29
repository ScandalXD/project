import { Request, Response } from "express";
import { deactivateUser, reactivateUser, updateUserRole } from "../services/adminUser.service";
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

export const deactivateUserHandler = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    await deactivateUser(Number(req.params.id));
    res.json({ message: "User deactivated" });
  } catch (e) {
    handleError(res, e);
  }
};

export const reactivateUserHandler = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    await reactivateUser(Number(req.params.id));
    res.json({ message: "User reactivated" });
  } catch (e) {
    handleError(res, e);
  }
};

export const updateUserRoleHandler = async (
  req: Request<{ id: string }, {}, { role: "user" | "admin" | "superadmin" }>,
  res: Response
) => {
  try {
    await updateUserRole(Number(req.params.id), req.body.role);
    res.json({ message: "User role updated" });
  } catch (e) {
    handleError(res, e);
  }
};