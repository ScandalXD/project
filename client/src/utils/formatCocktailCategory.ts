import type { CocktailCategory } from "../types/cocktail";

export function formatCocktailCategory(category: CocktailCategory | string) {
  if (category === "Alkoholowy") return "Alcoholic";
  if (category === "Bezalkoholowy") return "Non-alcoholic";

  return category;
}
