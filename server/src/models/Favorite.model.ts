export type CocktailType = "catalog" | "public";

export interface Favorite {
  user_id: number;
  cocktail_id: string | number;
  cocktail_type: CocktailType;
  created_at: string;
}