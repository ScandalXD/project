import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CocktailForm from "../../components/cocktails/CocktailForm";
import { cocktailsApi } from "../../api/cocktailsApi";
import type { CreateCocktailRequest } from "../../types/cocktail";

export default function CreateCocktailPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (data: CreateCocktailRequest) => {
    setIsSubmitting(true);
    setMessage("");

    try {
      await cocktailsApi.createCocktail(data);
      setMessage("Cocktail created.");

      setTimeout(() => {
        navigate("/my-cocktails");
      }, 800);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container catalog-form-page">
      <div className="card catalog-form-card">
        <h1>Create Cocktail</h1>

        <p className="muted-text">
          Add your own cocktail to the app.
        </p>

        {message && <p className="success-text">{message}</p>}

        <CocktailForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
