import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import AdminCatalogForm from "../../components/cocktails/AdminCatalogForm";
import FormPage from "../../components/ui/FormPage";

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
    <FormPage
      title="Create Catalog Cocktail"
      description="Add a new cocktail to the catalog."
      backTo="/admin"
      backLabel="Dashboard"
      message={message}
      className="admin-catalog-form-page"
    >
      <AdminCatalogForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </FormPage>
  );
}
