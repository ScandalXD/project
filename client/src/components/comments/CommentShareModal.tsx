import { useEffect, useState } from "react";
import { CheckCircle2, Search, X } from "lucide-react";
import { chatApi } from "../../api/chatApi";
import { friendsApi } from "../../api/friendsApi";
import type { Friendship } from "../../types/friend";
import Input from "../ui/Input";
import UserAvatar from "../ui/UserAvatar";

interface CommentShareModalProps {
  authorNickname: string;
  authorAvatar?: string | null;
  commentContent: string;
  commentPath: string;
  postTitle: string;
  postImage?: string | null;
  postPath: string;
  onClose: () => void;
}

export default function CommentShareModal({
  authorNickname,
  authorAvatar,
  commentContent,
  commentPath,
  postTitle,
  postImage,
  postPath,
  onClose,
}: CommentShareModalProps) {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState<number | null>(null);
  const [sharingFriendId, setSharingFriendId] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    friendsApi
      .getFriends()
      .then(setFriends)
      .catch(() => setError("Failed to load friends."));
  }, []);

  const filteredFriends = friends.filter((friend) =>
    (friend.friend_nickname || "")
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );

  const handleSend = async () => {
    if (!selectedFriendId || sharingFriendId) return;

    setError("");
    setStatus("");
    setSharingFriendId(selectedFriendId);

    try {
      const { conversationId } = await chatApi.openConversation(selectedFriendId);

      await chatApi.sendTextMessage(
        conversationId,
        message.trim() || null,
        null,
        {
          sharedType: "comment",
          commentAuthorNickname: authorNickname,
          commentAuthorAvatar: authorAvatar ?? null,
          commentContent,
          commentPath,
          postTitle,
          postImage: postImage || null,
          postPath,
        },
      );
      setStatus("Comment sent.");
      setMessage("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to share comment.");
    } finally {
      setSharingFriendId(null);
    }
  };

  return (
    <div className="modal-backdrop share-modal-backdrop" role="presentation">
      <section className="share-modal" role="dialog" aria-modal="true">
        <header className="share-modal-header">
          <button
            type="button"
            className="share-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={24} aria-hidden="true" />
          </button>
          <h2>Share comment</h2>
          <span aria-hidden="true" />
        </header>

        <div className="share-search">
          <Search size={18} aria-hidden="true" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search friends"
          />
        </div>

        {status && (
          <div className="share-status share-status-success">
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>{status}</span>
          </div>
        )}
        {error && <p className="error-text share-status">{error}</p>}

        <div className="share-friends-grid">
          {filteredFriends.map((friend) => {
            const isSelected = selectedFriendId === friend.friend_id;

            return (
              <button
                key={friend.friend_id}
                type="button"
                className={`share-friend-item ${isSelected ? "is-selected" : ""}`}
                onClick={() =>
                  setSelectedFriendId((current) =>
                    current === friend.friend_id ? null : Number(friend.friend_id),
                  )
                }
              >
                <span className="share-friend-avatar-wrap">
                  <UserAvatar
                    nickname={friend.friend_nickname}
                    avatar={friend.friend_avatar}
                    className="share-friend-avatar"
                  />
                  {isSelected && (
                    <span className="share-friend-check" aria-hidden="true">
                      <CheckCircle2 size={14} />
                    </span>
                  )}
                </span>
                <span>{friend.friend_nickname}</span>
              </button>
            );
          })}
        </div>

        {selectedFriendId && (
          <div className="share-message-box">
            <Input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write a message..."
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sharingFriendId !== null}
            >
              {sharingFriendId ? "Sending..." : "Send"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
