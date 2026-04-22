import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CocktailForm from "../../components/cocktails/CocktailForm";
import { cocktailsApi } from "../../api/cocktailsApi";
import type { UserCocktail, CreateCocktailRequest } from "../../types/cocktail";

export default function EditCocktailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cocktail, setCocktail] = useState<UserCocktail | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async (data: CreateCocktailRequest) => {
    if (!id) return;

    setIsSubmitting(true);

    try {
      await cocktailsApi.updateCocktail(Number(id), data);
      navigate("/my-cocktails");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  if (!cocktail) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{
        maxWidth: "720px",
        margin: "0 auto",
        background: "#ffffff",
        padding: "24px",
        borderRadius: "16px",
      }}
    >
      <h1>Edit Cocktail</h1>

      <CocktailForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        mode="edit"
        initialData={{
          name: cocktail.name,
          category: cocktail.category as any,
          ingredients: cocktail.ingredients,
          instructions: cocktail.instructions,
          currentImage: cocktail.image ?? null,
        }}
      />
    </div>
  );
}