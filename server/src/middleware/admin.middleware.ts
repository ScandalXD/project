import { Request, Response, NextFunction } from "express";

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (req.user.role !== "admin" && req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};

export const requireSuperadmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Superadmin access required" });
  }

  next();
};