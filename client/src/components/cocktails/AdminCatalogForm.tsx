import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { getImageUrl } from "../../utils/getImageUrl";

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
      setError("Wypełnij wszystkie wymagane pola.");
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
      setError("Nie udało się zapisać koktajlu katalogowego.");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "14px" }}>
      {mode === "create" && (
        <input
          type="text"
          name="id"
          placeholder="id, np. mojito"
          value={form.id}
          onChange={handleChange}
          required
          style={{
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
          }}
        />
      )}

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

      {mode === "edit" && form.currentImage && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "220px 1fr",
            gap: "16px",
            alignItems: "start",
          }}
        >
          <div>
            <p style={{ marginTop: 0, marginBottom: "8px" }}>Current image</p>
            <div
              style={{
                width: "220px",
                height: "160px",
                borderRadius: "12px",
                overflow: "hidden",
                border: "1px solid #d1d5db",
                background: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={getImageUrl(form.currentImage)}
                alt="Current catalog cocktail"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
              />
            </div>
          </div>

          <div>
            <p style={{ marginTop: 0, marginBottom: "8px" }}>Choose new file</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ padding: "8px 0" }}
            />
          </div>
        </div>
      )}

      {mode === "create" && (
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{ padding: "8px 0" }}
        />
      )}

      {error && <p style={{ color: "#dc2626", margin: 0 }}>{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting || (mode === "edit" && !isChanged)}
        style={{
          border: "none",
          background: "#111827",
          color: "#ffffff",
          padding: "12px",
          borderRadius: "10px",
          cursor: isSubmitting || (mode === "edit" && !isChanged) ? "not-allowed" : "pointer",
          opacity: isSubmitting || (mode === "edit" && !isChanged) ? 0.6 : 1,
        }}
      >
        {isSubmitting ? "Saving..." : mode === "edit" ? "Save changes" : "Create catalog cocktail"}
      </button>
    </form>
  );
}