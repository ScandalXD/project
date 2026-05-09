type EmptyStateProps = {
  text: string;
};

export default function EmptyState({ text }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p>{text}</p>
    </div>
  );
}