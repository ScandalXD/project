import CommentForm from "./CommentForm";

interface ReplyFormProps {
  onSubmit: (content: string) => Promise<void>;
}

export default function ReplyForm({ onSubmit }: ReplyFormProps) {
  return (
    <div className="reply-form-wrap">
      <CommentForm
        onSubmit={onSubmit}
        placeholder="Write a reply..."
        buttonText="Reply"
      />
    </div>
  );
}