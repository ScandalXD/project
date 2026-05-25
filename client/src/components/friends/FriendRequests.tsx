import type { Friendship } from "../../types/friend";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";

interface FriendRequestsProps {
  incoming: Friendship[];
  outgoing: Friendship[];
  onAccept: (friendshipId: number) => Promise<void>;
  onReject: (friendshipId: number) => Promise<void>;
}

export default function FriendRequests({
  incoming,
  outgoing,
  onAccept,
  onReject,
}: FriendRequestsProps) {
  return (
    <section className="friends-panel card">
      <div className="friends-panel-header">
        <div>
          <h2>Requests</h2>
          <p className="muted-text">Incoming and outgoing friend requests.</p>
        </div>
      </div>

      <div className="friends-columns">
        <div>
          <h3 className="friends-subtitle">Incoming</h3>

          {incoming.length === 0 ? (
            <EmptyState text="No incoming requests" />
          ) : (
            <div className="friends-list">
              {incoming.map((request) => (
                <div key={request.id} className="friend-row">
                  <div className="friend-avatar" aria-hidden="true">
                    {(request.requester_nickname ?? "?").charAt(0).toUpperCase()}
                  </div>

                  <div className="friend-row-main">
                    <h3>{request.requester_nickname}</h3>
                    <p className="muted-text">Wants to be friends</p>
                  </div>

                  <div className="friend-actions">
                    <Button onClick={() => onAccept(request.id)}>Accept</Button>
                    <Button
                      variant="secondary"
                      onClick={() => onReject(request.id)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="friends-subtitle">Outgoing</h3>

          {outgoing.length === 0 ? (
            <EmptyState text="No outgoing requests" />
          ) : (
            <div className="friends-list">
              {outgoing.map((request) => (
                <div key={request.id} className="friend-row">
                  <div className="friend-avatar" aria-hidden="true">
                    {(request.receiver_nickname ?? "?").charAt(0).toUpperCase()}
                  </div>

                  <div className="friend-row-main">
                    <h3>{request.receiver_nickname}</h3>
                    <p className="muted-text">Waiting for response</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
