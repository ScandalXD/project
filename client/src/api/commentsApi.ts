import { api } from "./axios";
import type { CommentCocktailType, CommentItemData } from "../types/comment";

export const commentsApi = {
  async getComments(
    cocktailId: string | number,
    cocktailType: CommentCocktailType
  ): Promise<CommentItemData[]> {
    const response = await api.get<CommentItemData[]>(
      `/comments/${cocktailType}/${cocktailId}`
    );
    return response.data;
  },

  async addComment(data: {
    cocktailId: string;
    cocktailType: CommentCocktailType;
    content: string;
    parentCommentId?: number | null;
  }): Promise<{ message: string; commentId: number }> {
    const response = await api.post("/comments", data);
    return response.data;
  },

  async deleteComment(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/comments/${id}`);
    return response.data;
  },

  async addCommentLike(commentId: number): Promise<{ message: string }> {
    const response = await api.post("/comment-likes", { commentId });
    return response.data;
  },

  async removeCommentLike(commentId: number): Promise<{ message: string }> {
    const response = await api.delete(`/comment-likes/${commentId}`);
    return response.data;
  },
};