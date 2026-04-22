import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import AdminCatalogForm from "../../components/cocktails/AdminCatalogForm";

export default function AdminCatalogCreatePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (data: {
    id?: string;
    name: string;
    category: "Alkoholowy" | "Bezalkoholowy";
    ingredients: string;
    instructions: string;
    image?: File | null;
  }) => {
    setIsSubmitting(true);
    setMessage("");

    try {
      await adminApi.createCatalogCocktail({
        id: data.id!,
        name: data.name,
        category: data.category,
        ingredients: data.ingredients,
        instructions: data.instructions,
        image: data.image,
      });

      setMessage("Catalog cocktail created.");
      setTimeout(() => {
        navigate("/admin/catalog");
      }, 700);
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
      <h1 style={{ marginBottom: "8px" }}>Create Catalog Cocktail</h1>
      <p style={{ color: "#6b7280", marginBottom: "20px" }}>
        Dodaj nowy koktajl do katalogu.
      </p>

      {message && <p style={{ color: "#059669" }}>{message}</p>}

      <AdminCatalogForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}