import { getImageUrl } from "../../utils/getImageUrl";

interface UserAvatarProps {
  nickname?: string | null;
  avatar?: string | null;
  className?: string;
}

export default function UserAvatar({
  nickname,
  avatar,
  className = "",
}: UserAvatarProps) {
  const initial = nickname?.trim().charAt(0).toUpperCase() || "?";

  return (
    <span className={`user-avatar ${className}`.trim()} aria-hidden="true">
      {avatar ? <img src={getImageUrl(avatar)} alt="" /> : initial}
    </span>
  );
}
