import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type To } from "react-router-dom";

interface PageHeaderActionProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  to?: To;
  className?: string;
  children: ReactNode;
}

export default function PageHeaderAction({
  to,
  className = "",
  children,
  type = "button",
  ...props
}: PageHeaderActionProps) {
  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button {...props} type={type} className={className}>
      {children}
    </button>
  );
}
