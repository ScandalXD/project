import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type {
  CocktailCategory,
  CreateCocktailRequest,
} from "../../types/cocktail";
import { getImageUrl } from "../../utils/getImageUrl";

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
      setError("Wypełnij wszystkie wymagane pola.");
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
      setError("Nie udało się zapisać koktajlu.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="cocktail-form">
      <input
        type="text"
        name="name"
        placeholder="Nazwa koktajlu"
        value={form.name}
        onChange={handleChange}
        required
        className="app-input"
      />

      <select
        name="category"
        value={form.category}
        onChange={handleChange}
        className="app-select cocktail-form-select"
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
        className="app-textarea"
      />

      <textarea
        name="instructions"
        placeholder="Przygotowanie"
        value={form.instructions}
        onChange={handleChange}
        required
        rows={5}
        className="app-textarea"
      />

      {mode === "edit" && form.currentImage && (
        <div className="cocktail-form-image-row">
          <div>
            <p className="cocktail-form-label">Current image</p>

            <div className="cocktail-form-image-preview">
              <img
                src={getImageUrl(form.currentImage)}
                alt="Current cocktail"
                className="cocktail-form-image"
              />
            </div>
          </div>

          <div>
            <p className="cocktail-form-label">Choose new file</p>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="cocktail-form-file"
            />
          </div>
        </div>
      )}

      {mode === "create" && (
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="cocktail-form-file"
        />
      )}

      {error && <p className="error-text cocktail-form-error">{error}</p>}

      <button
        type="submit"
        disabled={isDisabled}
        className="cocktail-form-submit"
      >
        {isSubmitting
          ? "Saving..."
          : mode === "edit"
            ? "Save changes"
            : "Create cocktail"}
      </button>
    </form>
  );
}
