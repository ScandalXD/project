import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

export default function Select({ className = "", ...props }: SelectProps) {
  return <select {...props} className={`app-select ${className}`.trim()} />;
}
