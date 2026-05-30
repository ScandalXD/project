import type { Friendship } from "../../types/friend";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";

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
    <section className="friends-panel card">
      <div className="friends-panel-header">
        <div>
          <h2>Your Friends</h2>
          <p className="muted-text">Manage friends and blocked users.</p>
        </div>
      </div>

      {friends.length === 0 ? (
        <EmptyState text="No friends yet" />
      ) : (
        <div className="friends-list">
          {friends.map((friendship) => (
            <div key={friendship.id} className="friend-row">
              <div className="friend-avatar" aria-hidden="true">
                {(friendship.friend_nickname ?? "?").charAt(0).toUpperCase()}
              </div>

              <div className="friend-row-main">
                <h3>{friendship.friend_nickname}</h3>
                <p className="muted-text">Friend</p>
              </div>

              {friendship.friend_id && (
                <div className="friend-actions">
                  <Button onClick={() => onMessage(Number(friendship.friend_id))}>
                    Message
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => onRemove(Number(friendship.friend_id))}
                  >
                    Remove
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() => onBlock(Number(friendship.friend_id))}
                  >
                    Block
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="friends-blocked-section">
        <h3 className="friends-subtitle">Blocked Users</h3>

        {blockedUsers.length === 0 ? (
          <EmptyState text="No blocked users" />
        ) : (
          <div className="friends-list">
            {blockedUsers.map((friendship) => (
              <div key={friendship.id} className="friend-row">
                <div className="friend-avatar" aria-hidden="true">
                  {(friendship.receiver_nickname ?? "?").charAt(0).toUpperCase()}
                </div>

                <div className="friend-row-main">
                  <h3>{friendship.receiver_nickname}</h3>
                  <p className="muted-text">Blocked</p>
                </div>

                <Button onClick={() => onUnblock(friendship.receiver_id)}>
                  Unblock
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
