import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Textarea from "../ui/Textarea";
import CocktailImageField from "./CocktailImageField";

interface AdminCatalogFormProps {
  mode: "create" | "edit";
  initialData?: {
    id?: string;
    name?: string;
    category?: "Alkoholowy" | "Bezalkoholowy";
    ingredients?: string;
    instructions?: string;
    currentImage?: string | null;
  };
  onSubmit: (data: {
    id?: string;
    name: string;
    category: "Alkoholowy" | "Bezalkoholowy";
    ingredients: string;
    instructions: string;
    image?: File | null;
    currentImage?: string | null;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export default function AdminCatalogForm({
  mode,
  initialData,
  onSubmit,
  isSubmitting = false,
}: AdminCatalogFormProps) {
  const initialForm = useMemo(
    () => ({
      id: initialData?.id ?? "",
      name: initialData?.name ?? "",
      category:
        initialData?.category ?? ("Alkoholowy" as "Alkoholowy" | "Bezalkoholowy"),
      ingredients: initialData?.ingredients ?? "",
      instructions: initialData?.instructions ?? "",
      currentImage: initialData?.currentImage ?? "",
    }),
    [initialData]
  );

  const [form, setForm] = useState(initialForm);
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState("");

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    setImage(e.target.files?.[0] ?? null);
  };

  const isChanged =
    form.id !== initialForm.id ||
    form.name !== initialForm.name ||
    form.category !== initialForm.category ||
    form.ingredients !== initialForm.ingredients ||
    form.instructions !== initialForm.instructions ||
    image !== null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !form.name.trim() ||
      !form.category ||
      !form.ingredients.trim() ||
      !form.instructions.trim() ||
      (mode === "create" && !form.id.trim())
    ) {
      setError("Fill in all required fields.");
      return;
    }

    if (mode === "edit" && !isChanged) {
      return;
    }

    try {
      await onSubmit({
        ...(mode === "create" ? { id: form.id.trim() } : {}),
        name: form.name.trim(),
        category: form.category,
        ingredients: form.ingredients.trim(),
        instructions: form.instructions.trim(),
        image,
        currentImage: form.currentImage || null,
      });
    } catch {
      setError("Failed to save catalog cocktail.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="cocktail-form admin-catalog-form">
      {mode === "create" && (
        <Input
          type="text"
          name="id"
          placeholder="id, e.g. mojito"
          value={form.id}
          onChange={handleChange}
          required
        />
      )}

      <Input
        type="text"
        name="name"
        placeholder="Cocktail name"
        value={form.name}
        onChange={handleChange}
        required
      />

      <Select
        name="category"
        value={form.category}
        onChange={handleChange}
        className="cocktail-form-select"
      >
        <option value="Alkoholowy">Alcoholic</option>
        <option value="Bezalkoholowy">Non-alcoholic</option>
      </Select>

      <Textarea
        name="ingredients"
        placeholder="Ingredients"
        value={form.ingredients}
        onChange={handleChange}
        required
        rows={4}
      />

      <Textarea
        name="instructions"
        placeholder="Instructions"
        value={form.instructions}
        onChange={handleChange}
        required
        rows={5}
      />

      <CocktailImageField
        mode={mode}
        currentImage={form.currentImage}
        currentImageAlt="Current catalog cocktail"
        imageName={image?.name}
        onChange={handleImageChange}
      />

      {error && <p className="error-text cocktail-form-error">{error}</p>}

      <Button
        type="submit"
        disabled={isSubmitting || (mode === "edit" && !isChanged)}
        className="cocktail-form-submit"
      >
        {isSubmitting ? "Saving..." : mode === "edit" ? "Save changes" : "Create catalog cocktail"}
      </Button>
    </form>
  );
}
