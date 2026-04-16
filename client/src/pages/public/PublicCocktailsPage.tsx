import { useEffect, useState } from "react";
import { cocktailsApi } from "../../api/cocktailsApi";
import CocktailCard from "../../components/cocktails/CocktailCard";
import type { CocktailCardData, PublicCocktail } from "../../types/cocktail";

export default function PublicCocktailsPage() {
  const [cocktails, setCocktails] = useState<PublicCocktail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCocktails = async () => {
      try {
        const data = await cocktailsApi.getPublicCocktails();
        setCocktails(data);
      } catch {
        setError("Nie udało się pobrać publicznych koktajli.");
      } finally {
        setIsLoading(false);
      }
    };

    loadCocktails();
  }, []);

  if (isLoading) {
    return <div>Loading public cocktails...</div>;
  }

  if (error) {
    return <div style={{ color: "#dc2626" }}>{error}</div>;
  }

  return (
    <section>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ marginBottom: "8px" }}>Public Cocktails</h1>
        <p style={{ color: "#6b7280", margin: 0 }}>
          Koktajle opublikowane przez społeczność użytkowników.
        </p>
      </div>

      {cocktails.length === 0 ? (
        <div>Brak publicznych koktajli.</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "20px",
          }}
        >
          {cocktails.map((cocktail) => {
            const cardData: CocktailCardData = {
              ...cocktail,
              type: "public",
            };

            return <CocktailCard key={cocktail.id} cocktail={cardData} />;
          })}
        </div>
      )}
    </section>
  );
}