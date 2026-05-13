import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { authorsApi } from "../../api/authorsApi";
import CocktailCard from "../../components/cocktails/CocktailCard";
import type { CocktailCardData } from "../../types/cocktail";

export default function AuthorProfilePage() {
  const { authorId } = useParams();
  const [cocktails, setCocktails] = useState<CocktailCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!authorId) {
        setError("Author not found.");
        setIsLoading(false);
        return;
      }

      try {
        setError("");

        const data = await authorsApi.getAuthorCocktails(authorId);
        setCocktails(data.map((item: CocktailCardData) => ({ ...item, type: "public" })));
      } catch {
        setError("Failed to load author cocktails.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [authorId]);

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="empty-state">Loading author cocktails...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="empty-state error-text">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1>Author cocktails</h1>
          <p className="muted-text">Published cocktails from this author.</p>
        </div>
      </div>

      {cocktails.length === 0 ? (
        <div className="empty-state">No cocktails yet</div>
      ) : (
        <div className="catalog-grid">
          {cocktails.map((cocktail) => (
            <CocktailCard key={cocktail.id} cocktail={cocktail} />
          ))}
        </div>
      )}
    </div>
  );
}