import { Request, Response } from "express";
import {
  addComment,
  getComments,
  deleteComment,
} from "../services/comment.service";
import { ServiceError } from "../services/cocktail.service";
import { CocktailType } from "../models/Comment.model";

const handleError = (res: Response, err: unknown) => {
  if (err instanceof ServiceError) {
    return res.status(err.status).json({ message: err.message });
  }

  if (err instanceof Error) {
    return res.status(400).json({ message: err.message });
  }

  return res.status(500).json({ message: "Internal server error" });
};

interface CommentBody {
  cocktailId: string;
  cocktailType: CocktailType;
  content: string;
}

export const addCommentHandler = async (
  req: Request<{}, {}, CommentBody>,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { cocktailId, cocktailType, content } = req.body;
    const commentId = await addComment(
      req.user.id,
      cocktailId,
      cocktailType,
      content
    );

    res.status(201).json({
      message: "Comment added",
      commentId,
    });
  } catch (e) {
    handleError(res, e);
  }
};

export const getCommentsHandler = async (
  req: Request<{ cocktailId: string; cocktailType: string }>,
  res: Response
) => {
  try {
    const comments = await getComments(
      req.params.cocktailId,
      req.params.cocktailType as CocktailType
    );
    res.json(comments);
  } catch (e) {
    handleError(res, e);
  }
};

export const deleteCommentHandler = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await deleteComment(req.user.id, Number(req.params.id));
    res.json({ message: "Comment deleted" });
  } catch (e) {
    handleError(res, e);
  }
};