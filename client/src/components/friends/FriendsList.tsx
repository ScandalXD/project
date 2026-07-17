import { Ban, MessageCircle, UserMinus } from "lucide-react";
import type { Friendship } from "../../types/friend";
import Button from "../ui/Button";
import UserAvatar from "../ui/UserAvatar";

interface FriendsListProps {
  friends: Friendship[];
  blockedUsers: Friendship[];
  onMessage: (friendId: number) => Promise<void>;
  onRemove: (friendId: number) => Promise<void>;
  onBlock: (userId: number) => Promise<void>;
  onUnblock: (userId: number) => Promise<void>;
}

export default function FriendsList({
  friends,
  blockedUsers,
  onMessage,
  onRemove,
  onBlock,
  onUnblock,
}: FriendsListProps) {
  return (
    <section className="friends-panel friends-panel-main card">
      <div className="friends-panel-header">
        <div>
          <h2>Friends</h2>
        </div>
        <span className="friends-count-pill">{friends.length}</span>
      </div>

      {friends.length === 0 ? (
        <p className="friends-inline-empty">No friends yet</p>
      ) : (
        <div className="friends-list">
          {friends.map((friendship) => (
            <div key={friendship.id} className="friend-row">
              <UserAvatar
                nickname={friendship.friend_nickname}
                avatar={friendship.friend_avatar}
                className="friend-avatar"
              />

              <div className="friend-row-main">
                <h3>{friendship.friend_nickname}</h3>
                <p className="muted-text">Friend</p>
              </div>

              {friendship.friend_id && (
                <div className="friend-actions">
                  <Button
                    onClick={() => onMessage(Number(friendship.friend_id))}
                    aria-label={`Message ${friendship.friend_nickname}`}
                    title="Message"
                  >
                    <MessageCircle size={16} aria-hidden="true" />
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => onRemove(Number(friendship.friend_id))}
                    aria-label={`Remove ${friendship.friend_nickname}`}
                    title="Remove friend"
                  >
                    <UserMinus size={16} aria-hidden="true" />
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() => onBlock(Number(friendship.friend_id))}
                    aria-label={`Block ${friendship.friend_nickname}`}
                    title="Block user"
                  >
                    <Ban size={16} aria-hidden="true" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <details className="friends-blocked-section">
        <summary>
          <span>Blocked users</span>
          <span className="friends-count-pill">{blockedUsers.length}</span>
        </summary>

        {blockedUsers.length === 0 ? (
          <p className="friends-inline-empty">No blocked users</p>
        ) : (
          <div className="friends-list">
            {blockedUsers.map((friendship) => (
              <div key={friendship.id} className="friend-row friend-row-blocked">
                <UserAvatar
                  nickname={friendship.receiver_nickname}
                  avatar={friendship.receiver_avatar}
                  className="friend-avatar"
                />

                <div className="friend-row-main">
                  <h3>{friendship.receiver_nickname}</h3>
                  <p className="muted-text">Blocked</p>
                </div>

                <div className="friend-actions">
                  <Button
                    className="friend-unblock-button"
                    onClick={() => onUnblock(friendship.receiver_id)}
                  >
                    Unblock
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </details>
    </section>
  );
}
