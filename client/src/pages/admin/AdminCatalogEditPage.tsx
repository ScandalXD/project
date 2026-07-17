import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import AdminCatalogForm from "../../components/cocktails/AdminCatalogForm";
import FormPage from "../../components/ui/FormPage";
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
    currentImage?: string | null;
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
    return (
      <div className="page-container catalog-form-page admin-catalog-form-page">
        <div className="empty-state error-text">{error}</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="page-container catalog-form-page admin-catalog-form-page">
        <div className="empty-state">Loading...</div>
      </div>
    );
  }

  return (
    <FormPage
      title="Edit Catalog Cocktail"
      description="Update the catalog cocktail details and save the changes."
      backTo="/admin"
      backLabel="Dashboard"
      className="admin-catalog-form-page"
    >
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
    </FormPage>
  );
}
