import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CocktailForm from "../../components/cocktails/CocktailForm";
import FormPage from "../../components/ui/FormPage";
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
    <FormPage
      title="Create Cocktail"
      description="Add your own cocktail to the app."
      backTo="/my-cocktails"
      backLabel="My Cocktails"
      message={message}
    >
      <CocktailForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </FormPage>
  );
}
