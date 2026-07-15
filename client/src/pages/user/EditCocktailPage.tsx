import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import CocktailForm from "../../components/cocktails/CocktailForm";
import { cocktailsApi } from "../../api/cocktailsApi";
import type {
  CocktailCategory,
  CreateCocktailRequest,
  UserCocktail,
} from "../../types/cocktail";

export default function EditCocktailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cocktail, setCocktail] = useState<UserCocktail | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setError("");

        const list = await cocktailsApi.getMyCocktails();
        const found = list.find((item) => item.id === Number(id));

        if (!found) {
          setError("Cocktail not found");
          return;
        }

        setCocktail(found);
      } catch {
        setError("Error loading cocktail");
      } finally {
        setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="page-container catalog-form-page">
        <div className="empty-state">Loading cocktail...</div>
      </div>
    );
  }

  if (error || !cocktail) {
    return (
      <div className="page-container catalog-form-page">
        <div className="empty-state error-text">
          {error || "Cocktail not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container catalog-form-page">
      <button
        type="button"
        className="page-back-button"
        onClick={() => navigate("/my-cocktails")}
      >
        <ArrowLeft size={18} aria-hidden="true" />
        <span>My Cocktails</span>
      </button>

      <div className="card catalog-form-card">
        <h1>Edit Cocktail</h1>

        <p className="muted-text">
          Update your cocktail details and save the changes.
        </p>

        <CocktailForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          mode="edit"
          initialData={{
            name: cocktail.name,
            category: cocktail.category as CocktailCategory,
            ingredients: cocktail.ingredients,
            instructions: cocktail.instructions,
            currentImage: cocktail.image ?? null,
          }}
        />
      </div>
    </div>
  );
}
