import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface FormPageProps {
  title: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
  message?: string;
  className?: string;
  children: ReactNode;
}

export default function FormPage({
  title,
  description,
  backTo,
  backLabel,
  message,
  className = "",
  children,
}: FormPageProps) {
  return (
    <div className={`page-container catalog-form-page ${className}`.trim()}>
      <div className="card catalog-form-card">
        {backTo && backLabel && (
          <Link to={backTo} className="page-back-button">
            <ArrowLeft size={18} aria-hidden="true" />
            <span>{backLabel}</span>
          </Link>
        )}

        <h1>{title}</h1>

        {description && <p className="muted-text">{description}</p>}
        {message && <p className="success-text">{message}</p>}

        {children}
      </div>
    </div>
  );
}
