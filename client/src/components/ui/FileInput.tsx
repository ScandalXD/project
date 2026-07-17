import type { InputHTMLAttributes } from "react";

interface FileInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  fileName?: string | null;
}

export default function FileInput({
  className = "",
  label = "Choose file",
  fileName,
  ...props
}: FileInputProps) {
  return (
    <label className={`app-file-input ${className}`.trim()}>
      <span className="app-file-input-button">{label}</span>
      <span className="app-file-input-name">
        {fileName || "No file selected"}
      </span>
      <input {...props} type="file" />
    </label>
  );
}
