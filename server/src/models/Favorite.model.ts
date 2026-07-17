export type CocktailType = "catalog" | "public";

export interface Favorite {
  user_id: number;
  cocktail_id: string | number;
  cocktail_type: CocktailType;
  author_id?: number | null;
  author_nickname?: string | null;
  author_avatar?: string | null;
  created_at: string;
}
