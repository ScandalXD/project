export type CocktailType = "catalog" | "public";

export interface CocktailComment {
  id: number;
  user_id: number;
  cocktail_id: string;
  cocktail_type: CocktailType;
  content: string;
  created_at: string;
  author_nickname?: string;
}