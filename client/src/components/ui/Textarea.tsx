import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export default function Textarea({ className = "", ...props }: TextareaProps) {
  return <textarea {...props} className={`app-textarea ${className}`.trim()} />;
}
