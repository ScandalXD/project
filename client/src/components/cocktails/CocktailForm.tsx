import { useState, type ChangeEvent, type FormEvent } from "react";
import type {
  CocktailCategory,
  CreateCocktailRequest,
} from "../../types/cocktail";

interface CocktailFormProps {
  onSubmit: (data: CreateCocktailRequest) => Promise<void>;
  isSubmitting?: boolean;
  initialData?: Partial<CreateCocktailRequest>;
}

export default function CocktailForm({
  onSubmit,
  isSubmitting = false,
  initialData,
}: CocktailFormProps) {
  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    category: initialData?.category ?? "Alkoholowy",
    ingredients: initialData?.ingredients ?? "",
    instructions: initialData?.instructions ?? "",
  });

  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState("");

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImage(file);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (
      !form.name ||
      !form.category ||
      !form.ingredients ||
      !form.instructions
    ) {
      setError("Wypełnij wszystkie wymagane pola.");
      return;
    }

    try {
      await onSubmit({
        ...form,
        image,
      });
    } catch {
      setError("Nie udało się zapisać koktajlu.");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "14px" }}>
      <input
        type="text"
        name="name"
        placeholder="Nazwa koktajlu"
        value={form.name}
        onChange={handleChange}
        required
        style={{
          padding: "12px",
          borderRadius: "10px",
          border: "1px solid #d1d5db",
        }}
      />

      <select
        name="category"
        value={form.category}
        onChange={handleChange}
        style={{
          padding: "12px",
          borderRadius: "10px",
          border: "1px solid #d1d5db",
        }}
      >
        <option value="Alkoholowy">Alkoholowy</option>
        <option value="Bezalkoholowy">Bezalkoholowy</option>
      </select>

      <textarea
        name="ingredients"
        placeholder="Składniki"
        value={form.ingredients}
        onChange={handleChange}
        required
        rows={4}
        style={{
          padding: "12px",
          borderRadius: "10px",
          border: "1px solid #d1d5db",
          resize: "vertical",
        }}
      />

      <textarea
        name="instructions"
        placeholder="Przygotowanie"
        value={form.instructions}
        onChange={handleChange}
        required
        rows={5}
        style={{
          padding: "12px",
          borderRadius: "10px",
          border: "1px solid #d1d5db",
          resize: "vertical",
        }}
      />

      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        style={{ padding: "8px 0" }}
      />

      {error && <p style={{ color: "#dc2626", margin: 0 }}>{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          border: "none",
          background: "#111827",
          color: "#ffffff",
          padding: "12px",
          borderRadius: "10px",
          cursor: "pointer",
        }}
      >
        {isSubmitting ? "Saving..." : "Create cocktail"}
      </button>
    </form>
  );
}
