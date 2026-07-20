import { ArrowLeft } from "lucide-react";
import type { To } from "react-router-dom";
import PageHeaderAction from "./PageHeaderAction";

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

  return (
    <PageHeaderAction
      to={to}
      className={buttonClassName}
      onClick={onClick}
    >
      {content}
    </PageHeaderAction>
  );
}
