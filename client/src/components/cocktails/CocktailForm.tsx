import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type {
  CocktailCategory,
  CreateCocktailRequest,
} from "../../types/cocktail";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Textarea from "../ui/Textarea";
import CocktailImageField from "./CocktailImageField";

interface CocktailFormProps {
  onSubmit: (data: CreateCocktailRequest) => Promise<void>;
  isSubmitting?: boolean;
  initialData?: Partial<CreateCocktailRequest>;
  mode?: "create" | "edit";
}

export default function CocktailForm({
  onSubmit,
  isSubmitting = false,
  initialData,
  mode = "create",
}: CocktailFormProps) {
  const initialForm = useMemo(
    () => ({
      name: initialData?.name ?? "",
      category:
        (initialData?.category as CocktailCategory | undefined) ?? "Alkoholowy",
      ingredients: initialData?.ingredients ?? "",
      instructions: initialData?.instructions ?? "",
      currentImage: initialData?.currentImage ?? "",
    }),
    [initialData],
  );

  const [form, setForm] = useState(initialForm);
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

  const isChanged =
    form.name !== initialForm.name ||
    form.category !== initialForm.category ||
    form.ingredients !== initialForm.ingredients ||
    form.instructions !== initialForm.instructions ||
    image !== null;

  const isDisabled = isSubmitting || (mode === "edit" && !isChanged);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (
      !form.name ||
      !form.category ||
      !form.ingredients ||
      !form.instructions
    ) {
      setError("Fill in all required fields.");
      return;
    }

    if (mode === "edit" && !isChanged) {
      return;
    }

    try {
      await onSubmit({
        name: form.name,
        category: form.category,
        ingredients: form.ingredients,
        instructions: form.instructions,
        image,
        currentImage: form.currentImage || null,
      });
    } catch {
      setError("Failed to save cocktail.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="cocktail-form">
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
        imageName={image?.name}
        onChange={handleImageChange}
      />

      {error && <p className="error-text cocktail-form-error">{error}</p>}

      <Button
        type="submit"
        disabled={isDisabled}
        className="cocktail-form-submit"
      >
        {isSubmitting
          ? "Saving..."
          : mode === "edit"
            ? "Save changes"
            : "Create cocktail"}
      </Button>
    </form>
  );
}
