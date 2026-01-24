import { Request, Response } from "express";

export const getProfile = (req: Request, res: Response) => {
  const user = (req as any).user;

  res.json({
    message: "Protected profile data",
    user
  });
};
