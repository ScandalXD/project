export type CocktailType = "catalog" | "public";

export interface CocktailComment {
  id: number;
  user_id: number;
  cocktail_id: string;
  cocktail_type: CocktailType;
  content: string;
  parent_comment_id: number | null;
  created_at: string;
  author_nickname?: string;
  cocktail_name?: string;
  cocktail_image?: string | null;
  likes_count?: number;
  is_liked_by_user?: boolean;
  replies?: CocktailComment[];
}
