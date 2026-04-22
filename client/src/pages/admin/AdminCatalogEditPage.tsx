import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import AdminCatalogForm from "../../components/cocktails/AdminCatalogForm";
import type { CatalogCocktail } from "../../types/cocktail";

export default function AdminCatalogEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState<CatalogCocktail | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminApi.getCatalogCocktailById(id!);

        if (!data) {
          setError("Catalog cocktail not found");
          return;
        }

        setItem(data);
      } catch {
        setError("Error loading catalog cocktail");
      }
    };

    load();
  }, [id]);

  const handleSubmit = async (data: {
    name: string;
    category: "Alkoholowy" | "Bezalkoholowy";
    ingredients: string;
    instructions: string;
    image?: File | null;
  }) => {
    if (!id) return;

    setIsSubmitting(true);

    try {
      await adminApi.updateCatalogCocktail(id, data);
      navigate("/admin/catalog");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return <div style={{ color: "#dc2626" }}>{error}</div>;
  }

  if (!item) {
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
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
      }}
    >
      <h1 style={{ marginBottom: "8px" }}>Edit Catalog Cocktail</h1>
      <p style={{ color: "#6b7280", marginBottom: "20px" }}>
        Zaktualizuj dane koktajlu katalogowego.
      </p>

      <AdminCatalogForm
        mode="edit"
        initialData={{
          name: item.name,
          category: item.category as "Alkoholowy" | "Bezalkoholowy",
          ingredients: item.ingredients,
          instructions: item.instructions,
          currentImage: item.image ?? null,
        }}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}