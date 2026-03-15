export interface CatalogCocktail {
  id: string;
  name: string;
  category: "Alkoholowy" | "Bezalkoholowy";
  ingredients: string;
  instructions: string;
  image: string;
  created_at: string;
}
