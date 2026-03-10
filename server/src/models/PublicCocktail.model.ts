import { CocktailCategory } from "./UserCocktail.model";

export interface PublicCocktail {
  id: number;
  author_id: number;
  author_nickname: string;
  name: string;
  category: CocktailCategory;
  ingredients: string;
  instructions: string;
  image: string | null;
  created_at: string;
}