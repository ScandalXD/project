import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cocktailsApi } from "../../api/cocktailsApi";
import CocktailCard from "../../components/cocktails/CocktailCard";
import type { CatalogCocktail, CocktailCardData } from "../../types/cocktail";

export default function CatalogPage() {
  const [cocktails, setCocktails] = useState<CatalogCocktail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCocktails = async () => {
      try {
        const data = await cocktailsApi.getCatalogCocktails();
        setCocktails(data);
      } catch {
        setError("Nie udało się pobrać katalogu koktajli.");
      } finally {
        setIsLoading(false);
      }
    };

    loadCocktails();
  }, []);

  if (isLoading) {
    return <div>Loading catalog...</div>;
  }

  if (error) {
    return <div style={{ color: "#dc2626" }}>{error}</div>;
  }

  return (
    <section>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ marginBottom: "8px" }}>Catalog Cocktails</h1>
        <p style={{ color: "#6b7280", margin: 0 }}>
          Gotowe przepisy dostępne w katalogu aplikacji.
        </p>
      </div>

      {cocktails.length === 0 ? (
        <div>Brak koktajli w katalogu.</div>
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
              type: "catalog",
            };

            return (
              <Link
                key={cocktail.id}
                to={`/catalog/${cocktail.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <CocktailCard cocktail={cardData} />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}