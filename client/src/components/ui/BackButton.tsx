import { ArrowLeft } from "lucide-react";
import { Link, type To } from "react-router-dom";

interface BackButtonProps {
  label: string;
  to?: To;
  onClick?: () => void;
  className?: string;
}

export default function BackButton({
  label,
  to,
  onClick,
  className = "",
}: BackButtonProps) {
  const content = (
    <>
      <ArrowLeft size={18} aria-hidden="true" />
      <span>{label}</span>
    </>
  );

  const buttonClassName = `page-back-button ${className}`.trim();

  if (to) {
    return (
      <Link to={to} className={buttonClassName}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={buttonClassName} onClick={onClick}>
      {content}
    </button>
  );
}
