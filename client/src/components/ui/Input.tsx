import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export default function Input({ style, ...props }: InputProps) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "12px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border)",
        outline: "none",
        fontSize: "15px",
        ...style,
      }}
    />
  );
}