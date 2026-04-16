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
      setMessage("Koktajl został utworzony.");
      setTimeout(() => {
        navigate("/my-cocktails");
      }, 800);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "720px",
        margin: "0 auto",
        background: "#ffffff",
        padding: "24px",
        borderRadius: "16px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
      }}
    >
      <h1 style={{ marginBottom: "8px" }}>Create Cocktail</h1>
      <p style={{ color: "#6b7280", marginBottom: "20px" }}>
        Dodaj swój własny koktajl do aplikacji.
      </p>

      {message && <p style={{ color: "#059669" }}>{message}</p>}

      <CocktailForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}