import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
}

export default function IconActionButton({
  label,
  children,
  className = "",
  type = "button",
  ...props
}: IconActionButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`icon-action-button ${className}`.trim()}
      aria-label={label}
      title={props.title ?? label}
    >
      {children}
    </button>
  );
}
