import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "warning" | "info";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
}

export default function Button({
  children,
  variant = "primary",
  style,
  ...props
}: ButtonProps) {
  const getBackground = () => {
    if (variant === "danger") return "var(--color-danger)";
    if (variant === "warning") return "var(--color-warning)";
    if (variant === "info") return "var(--color-info)";
    if (variant === "secondary") return "var(--color-secondary)";
    return "var(--color-primary)";
  };

  const getColor = () => {
    if (variant === "secondary") return "var(--color-text)";
    return "#ffffff";
  };

  return (
    <button
      {...props}
      style={{
        border:
          variant === "secondary"
            ? "1px solid var(--color-border)"
            : "none",
        background: getBackground(),
        color: getColor(),
        padding: "10px 14px",
        borderRadius: "var(--radius-md)",
        cursor: props.disabled ? "not-allowed" : "pointer",
        fontWeight: 600,
        opacity: props.disabled ? 0.7 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}