import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { cocktailsApi } from "../../api/cocktailsApi";
import { getImageUrl } from "../../utils/getImageUrl";
import type { UserCocktail } from "../../types/cocktail";

export default function CocktailDetailsPage() {
  const { id } = useParams();
  const [cocktail, setCocktail] = useState<UserCocktail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const list = await cocktailsApi.getMyCocktails();
        const found = list.find((c) => c.id === Number(id));

        if (!found) {
          setError("Cocktail not found");
          return;
        }

        setCocktail(found);
      } catch {
        setError("Error loading cocktail");
      }
    };

    load();
  }, [id]);

  if (!cocktail) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {cocktail.image && (
        <div
          style={{
            width: "100%",
            height: "420px",
            background: "#e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        >
          <img
            src={getImageUrl(cocktail.image)}
            alt={cocktail.name}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>
      )}

      <h1>{cocktail.name}</h1>

      <p>
        <strong>Category:</strong> {cocktail.category}
      </p>
      <p>
        <strong>Ingredients:</strong> {cocktail.ingredients}
      </p>
      <p>
        {" "}
        <strong>Instructions:</strong> {cocktail.instructions}
      </p>
    </div>
  );
}
