interface OnlineBadgeProps {
  isOnline: boolean | number;
  lastSeenAt?: string | null;
}

export default function OnlineBadge({ isOnline, lastSeenAt }: OnlineBadgeProps) {
  if (isOnline) {
    return <span className="chat-online-badge chat-online">Online</span>;
  }

  return (
    <span className="chat-online-badge">
      {lastSeenAt
        ? `Last seen ${new Date(lastSeenAt).toLocaleString("pl-PL")}`
        : "Offline"}
    </span>
  );
}
