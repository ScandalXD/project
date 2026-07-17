import { Check, Clock, X } from "lucide-react";
import type { Friendship } from "../../types/friend";
import Button from "../ui/Button";
import UserAvatar from "../ui/UserAvatar";

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
    <section className="friends-panel friends-panel-requests card">
      <div className="friends-panel-header">
        <div>
          <h2>Requests</h2>
        </div>
        <span className="friends-count-pill">
          {incoming.length + outgoing.length}
        </span>
      </div>

      <div className="friends-columns">
        <div className="friends-request-group">
          <h3 className="friends-subtitle">
            <Check size={16} aria-hidden="true" />
            Incoming
          </h3>

          {incoming.length === 0 ? (
            <p className="friends-inline-empty">No incoming requests</p>
          ) : (
            <div className="friends-list">
              {incoming.map((request) => (
                <div key={request.id} className="friend-row">
                  <UserAvatar
                    nickname={request.requester_nickname}
                    avatar={request.requester_avatar}
                    className="friend-avatar"
                  />

                  <div className="friend-row-main">
                    <h3>{request.requester_nickname}</h3>
                    <p className="muted-text">Wants to be friends</p>
                  </div>

                  <div className="friend-actions">
                    <Button
                      className="friend-request-accept"
                      onClick={() => onAccept(request.id)}
                      aria-label={`Accept request from ${request.requester_nickname}`}
                      title="Accept"
                    >
                      <Check size={16} aria-hidden="true" />
                    </Button>
                    <Button
                      variant="secondary"
                      className="friend-request-reject"
                      onClick={() => onReject(request.id)}
                      aria-label={`Reject request from ${request.requester_nickname}`}
                      title="Reject"
                    >
                      <X size={16} aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="friends-request-group">
          <h3 className="friends-subtitle">
            <Clock size={16} aria-hidden="true" />
            Outgoing
          </h3>

          {outgoing.length === 0 ? (
            <p className="friends-inline-empty">No outgoing requests</p>
          ) : (
            <div className="friends-list">
              {outgoing.map((request) => (
                <div key={request.id} className="friend-row">
                  <UserAvatar
                    nickname={request.receiver_nickname}
                    avatar={request.receiver_avatar}
                    className="friend-avatar"
                  />

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
