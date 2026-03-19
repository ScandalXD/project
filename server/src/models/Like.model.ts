export type CocktailType = "catalog" | "public";

export interface CocktailLike {
  user_id: number;
  cocktail_id: string;
  cocktail_type: CocktailType;
  created_at: string;
}