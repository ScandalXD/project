import { useState, type FormEvent } from "react";

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  buttonText?: string;
}

export default function CommentForm({
  onSubmit,
  placeholder = "Write a comment...",
  buttonText = "Send",
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!content.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(content.trim());
      setContent("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "10px" }}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={3}
        style={{
          padding: "12px",
          borderRadius: "10px",
          border: "1px solid #d1d5db",
          resize: "vertical",
        }}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          border: "none",
          background: "#111827",
          color: "#ffffff",
          padding: "10px 14px",
          borderRadius: "10px",
          cursor: "pointer",
          width: "fit-content",
        }}
      >
        {isSubmitting ? "Sending..." : buttonText}
      </button>
    </form>
  );
}