import { useEffect, useState } from "react";
import { Check, CheckCircle2, Copy, Mail, MessageCircle, Search } from "lucide-react";
import { chatApi } from "../../api/chatApi";
import { friendsApi } from "../../api/friendsApi";
import { useAuth } from "../../hooks/useAuth";
import type { ChatCocktailType } from "../../types/chat";
import type { Friendship } from "../../types/friend";

interface CocktailShareModalProps {
  cocktailId: string | number;
  cocktailName: string;
  cocktailType: ChatCocktailType;
  detailsPath: string;
  onClose: () => void;
}

export default function CocktailShareModal({
  cocktailId,
  cocktailName,
  cocktailType,
  detailsPath,
  onClose,
}: CocktailShareModalProps) {
  const { isAuthenticated } = useAuth();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [friendSearch, setFriendSearch] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [shareError, setShareError] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [sharingFriendId, setSharingFriendId] = useState<number | null>(null);

  const shareUrl = `${window.location.origin}${detailsPath}`;
  const filteredFriends = friends.filter((friend) =>
    (friend.friend_nickname || "")
      .toLowerCase()
      .includes(friendSearch.toLowerCase())
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadFriends = async () => {
      try {
        const data = await friendsApi.getFriends();
        setFriends(data);
      } catch {
        setShareError("Failed to load friends.");
      }
    };

    loadFriends();
  }, [isAuthenticated]);

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setShareStatus("Link copied.");
  };

  const shareToFriend = async () => {
    if (!selectedFriendId) return;

    setSharingFriendId(selectedFriendId);
    setShareStatus("");
    setShareError("");

    try {
      const { conversationId } = await chatApi.openConversation(selectedFriendId);
      await chatApi.sendCocktailShare(
        conversationId,
        String(cocktailId),
        cocktailType,
        message.trim() || null
      );

      setShareStatus("Cocktail sent.");
      setMessage("");
    } catch (error: any) {
      setShareError(
        error.response?.data?.message || "Failed to send cocktail."
      );
    } finally {
      setSharingFriendId(null);
    }
  };

  const toggleSelectedFriend = (friendId?: number) => {
    if (!friendId) return;

    setSelectedFriendId((current) => (current === friendId ? null : friendId));
    setShareStatus("");
    setShareError("");
  };

  return (
    <div className="modal-backdrop share-modal-backdrop" role="presentation">
      <div className="share-modal" role="dialog" aria-modal="true">
        <div className="share-modal-header">
          <button
            type="button"
            className="share-modal-close"
            onClick={onClose}
            aria-label="Close share modal"
          >
            x
          </button>
          <h2>Share</h2>
        </div>

        <label className="share-search">
          <Search size={18} aria-hidden="true" />
          <input
            value={friendSearch}
            onChange={(event) => setFriendSearch(event.target.value)}
            placeholder="Search"
          />
        </label>

        {shareStatus && (
          <div className="share-status share-status-success">
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>{shareStatus}</span>
          </div>
        )}
        {shareError && <p className="error-text">{shareError}</p>}

        <div className="share-friends-grid">
          {filteredFriends.map((friend) => {
            const name = friend.friend_nickname || "User";
            const isSelected = selectedFriendId === friend.friend_id;

            return (
              <button
                type="button"
                key={friend.friend_id}
                className={`share-friend-item ${
                  isSelected ? "is-selected" : ""
                }`}
                onClick={() => toggleSelectedFriend(friend.friend_id)}
                disabled={sharingFriendId === friend.friend_id}
              >
                <span className="share-friend-avatar">
                  {name.charAt(0).toUpperCase()}
                  {isSelected && (
                    <span className="share-friend-check">
                      <Check size={14} aria-hidden="true" />
                    </span>
                  )}
                </span>
                <span>{name}</span>
              </button>
            );
          })}
        </div>

        {selectedFriendId ? (
          <div className="share-message-box">
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write a message..."
            />
            <button
              type="button"
              onClick={shareToFriend}
              disabled={sharingFriendId !== null}
            >
              Send
            </button>
          </div>
        ) : (
          <div className="share-social-row">
            <button type="button" onClick={copyShareLink}>
              <span className="share-social-icon">
                <Copy size={22} aria-hidden="true" />
              </span>
              <span>Copy link</span>
            </button>

            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                shareUrl
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              <span className="share-social-icon">f</span>
              <span>Facebook</span>
            </a>

            <a
              href={`https://www.messenger.com/t/?link=${encodeURIComponent(
                shareUrl
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              <span className="share-social-icon">
                <MessageCircle size={22} aria-hidden="true" />
              </span>
              <span>Messenger</span>
            </a>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `${cocktailName} ${shareUrl}`
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              <span className="share-social-icon">WA</span>
              <span>WhatsApp</span>
            </a>

            <a
              href={`mailto:?subject=${encodeURIComponent(
                cocktailName
              )}&body=${encodeURIComponent(shareUrl)}`}
            >
              <span className="share-social-icon">
                <Mail size={22} aria-hidden="true" />
              </span>
              <span>Email</span>
            </a>

            <a
              href={`https://www.threads.net/intent/post?text=${encodeURIComponent(
                `${cocktailName} ${shareUrl}`
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              <span className="share-social-icon">@</span>
              <span>Threads</span>
            </a>

            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                cocktailName
              )}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
            >
              <span className="share-social-icon">X</span>
              <span>X</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
