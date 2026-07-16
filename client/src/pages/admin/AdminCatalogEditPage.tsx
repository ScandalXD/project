import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
    return <p className="error-text">{error}</p>;
  }

  if (!item) {
    return <p className="muted-text">Loading...</p>;
  }

  return (
    <div className="page-container catalog-form-page">
      <div className="card catalog-form-card">
        <Link to="/admin" className="page-back-button admin-dashboard-back">
          <ArrowLeft size={18} aria-hidden="true" />
          <span>Dashboard</span>
        </Link>

        <h1>Edit Catalog Cocktail</h1>

        <p className="muted-text">
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
    </div>
  );
}
