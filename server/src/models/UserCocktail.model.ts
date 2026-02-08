export type CocktailCategory = "Alkoholowy" | "Bezalkoholowy";

export interface UserCocktail {
  id: number;
  owner_id: number;
  name: string;
  category: CocktailCategory;
  ingredients: string;
  instructions: string;
  image: string | null;
  created_at: string;
}
