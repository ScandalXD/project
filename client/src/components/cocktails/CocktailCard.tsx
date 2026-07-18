import type { CocktailCardData } from "../../types/cocktail";
import { CocktailCardImage, CocktailCardSummary } from "./CocktailCardParts";

interface CocktailCardProps {
  cocktail: CocktailCardData;
}

export default function CocktailCard({ cocktail }: CocktailCardProps) {
  return (
    <article className="cocktail-card">
      <CocktailCardImage cocktail={cocktail} />

      <CocktailCardSummary
        cocktail={cocktail}
        showAuthor={cocktail.type === "public"}
      />
    </article>
  );
}
