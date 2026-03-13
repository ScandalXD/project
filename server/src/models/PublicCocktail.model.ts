export interface PublicCocktail {
  id: number;
  source_cocktail_id: number;
  author_id: number;
  name: string;
  category: "Alkoholowy" | "Bezalkoholowy";
  ingredients: string;
  instructions: string;
  image: string | null;
  created_at: string;
  author_nickname?: string;
}