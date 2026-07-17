import { Search, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { friendsApi } from "../../api/friendsApi";
import type { FriendSearchResult } from "../../types/friend";
import Button from "../ui/Button";
import Input from "../ui/Input";
import UserAvatar from "../ui/UserAvatar";

interface FriendSearchProps {
  onChanged: () => Promise<void>;
}

function getRelationshipLabel(user: FriendSearchResult) {
  if (user.relationship_status === "accepted") return "Friend";
  if (user.relationship_status === "blocked") return "Blocked";
  if (user.relationship_status === "pending") {
    return user.relationship_direction === "incoming"
      ? "Request received"
      : "Request sent";
  }
  if (user.relationship_status === "rejected") return "Rejected";
  return null;
}

export default function FriendSearch({ onChanged }: FriendSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FriendSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (query.trim().length < 2) {
      setError("Enter at least 2 characters.");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await friendsApi.searchUsers(query.trim());
      setResults(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Search failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRequest = async (userId: number) => {
    setError("");
    setMessage("");

    try {
      await friendsApi.sendFriendRequest(userId);
      setMessage("Friend request sent.");
      await handleRefreshAfterAction();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to send request.");
    }
  };

  const handleRefreshAfterAction = async () => {
    const data = await friendsApi.searchUsers(query.trim());
    setResults(data);
    await onChanged();
  };

  return (
    <section className="friends-panel friends-panel-search card">
      <div className="friends-panel-header">
        <div>
          <h2>Find people</h2>
        </div>
      </div>

      <form className="friends-search-form" onSubmit={handleSearch}>
        <div className="friends-search-input-wrap">
          <Search size={18} aria-hidden="true" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nickname"
          />

          <Button
            type="submit"
            className="friends-search-submit"
            disabled={isLoading}
            aria-label="Search users"
            title="Search"
          >
            <Search size={18} aria-hidden="true" />
          </Button>
        </div>
      </form>

      {message && <p className="success-text friends-message">{message}</p>}
      {error && <p className="error-text friends-message">{error}</p>}

      {results.length === 0 ? (
        <p className="friends-inline-empty">Search by nickname</p>
      ) : (
        <div className="friends-list">
          {results.map((user) => {
            const label = getRelationshipLabel(user);
            const canSendRequest =
              user.relationship_status === null ||
              user.relationship_status === "rejected";

            return (
              <div key={user.id} className="friend-row">
                <UserAvatar
                  nickname={user.nickname}
                  avatar={user.avatar}
                  className="friend-avatar"
                />

                <div className="friend-row-main">
                  <h3>{user.nickname}</h3>
                  {label && <p className="muted-text">{label}</p>}
                </div>

                <Button
                  className="friend-icon-action"
                  disabled={!canSendRequest}
                  onClick={() => handleSendRequest(user.id)}
                  aria-label={`Add ${user.nickname}`}
                  title="Add friend"
                >
                  <UserPlus size={17} aria-hidden="true" />
                  <span>Add</span>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
