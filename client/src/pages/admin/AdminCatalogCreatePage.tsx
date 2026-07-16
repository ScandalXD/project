import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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
    <div className="page-container catalog-form-page">
      <div className="card catalog-form-card">
        <Link to="/admin" className="page-back-button admin-dashboard-back">
          <ArrowLeft size={18} aria-hidden="true" />
          <span>Dashboard</span>
        </Link>

        <h1>Create Catalog Cocktail</h1>

        <p className="muted-text">
          Add a new cocktail to the catalog.
        </p>

        {message && <p className="success-text">{message}</p>}

        <AdminCatalogForm
          mode="create"
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
