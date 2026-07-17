import type { ChangeEvent } from "react";
import { getImageUrl } from "../../utils/getImageUrl";
import FileInput from "../ui/FileInput";

interface CocktailImageFieldProps {
  mode: "create" | "edit";
  currentImage?: string | null;
  imageName?: string;
  currentImageAlt?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export default function CocktailImageField({
  mode,
  currentImage,
  imageName,
  currentImageAlt = "Current cocktail",
  onChange,
}: CocktailImageFieldProps) {
  const input = (
    <FileInput
      accept="image/*"
      onChange={onChange}
      label="Choose image"
      fileName={imageName}
    />
  );

  if (mode === "create" || !currentImage) {
    return input;
  }

  return (
    <div className="cocktail-form-image-row">
      <div>
        <p className="cocktail-form-label">Current image</p>

        <div className="cocktail-form-image-preview">
          <img
            src={getImageUrl(currentImage)}
            alt={currentImageAlt}
            className="cocktail-form-image"
          />
        </div>
      </div>

      <div>
        <p className="cocktail-form-label">Choose new file</p>
        {input}
      </div>
    </div>
  );
}
