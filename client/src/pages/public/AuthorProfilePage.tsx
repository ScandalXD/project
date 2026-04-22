import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { authorsApi } from "../../api/authorsApi";
import CocktailCard from "../../components/cocktails/CocktailCard";

export default function AuthorProfilePage() {
  const { authorId } = useParams();
  const [cocktails, setCocktails] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    try {
      const data = await authorsApi.getAuthorCocktails(authorId!);
      setCocktails(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [authorId]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <h1>Author cocktails</h1>

      {cocktails.length === 0 ? (
        <p>No cocktails yet</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "20px",
          }}
        >
          {cocktails.map((c) => (
            <CocktailCard key={c.id} cocktail={{ ...c, type: "public" }} />
          ))}
        </div>
      )}
    </div>
  );
}
