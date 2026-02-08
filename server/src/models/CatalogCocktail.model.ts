import { CocktailCategory } from "./UserCocktail.model";

export interface CatalogCocktail {
  id: string;
  name: string;
  category: CocktailCategory;
  ingredients: string;
  instructions: string;
  image: string;
  created_at: string;
}
