import { useState, type FormEvent } from "react";
import Button from "../ui/Button";

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

    if (!content.trim()) return;

    setIsSubmitting(true);

    try {
      await onSubmit(content.trim());
      setContent("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="comment-form">
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="app-textarea"
      />

      <Button type="submit" disabled={isSubmitting} className="comment-form-submit">
        {isSubmitting ? "Sending..." : buttonText}
      </Button>
    </form>
  );
}