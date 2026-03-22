import { Request, Response } from "express";
import {
  addCommentLike,
  removeCommentLike,
  getCommentLikesCount,
  isCommentLikedByUser,
} from "../services/commentLike.service";
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

interface CommentLikeBody {
  commentId: number;
}

export const addCommentLikeHandler = async (
  req: Request<{}, {}, CommentLikeBody>,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await addCommentLike(req.user.id, Number(req.body.commentId));
    res.status(201).json({ message: "Comment like added" });
  } catch (e) {
    handleError(res, e);
  }
};

export const removeCommentLikeHandler = async (
  req: Request<{ commentId: string }>,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await removeCommentLike(req.user.id, Number(req.params.commentId));
    res.json({ message: "Comment like removed" });
  } catch (e) {
    handleError(res, e);
  }
};

export const getCommentLikesCountHandler = async (
  req: Request<{ commentId: string }>,
  res: Response
) => {
  try {
    const count = await getCommentLikesCount(Number(req.params.commentId));
    res.json({ count });
  } catch (e) {
    handleError(res, e);
  }
};

export const isCommentLikedByUserHandler = async (
  req: Request<{ commentId: string }>,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const liked = await isCommentLikedByUser(
      req.user.id,
      Number(req.params.commentId)
    );
    res.json({ liked });
  } catch (e) {
    handleError(res, e);
  }
};