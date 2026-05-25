import { useState, type FormEvent } from "react";
import { friendsApi } from "../../api/friendsApi";
import type { FriendSearchResult } from "../../types/friend";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";
import Input from "../ui/Input";

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
    <section className="friends-panel card">
      <div className="friends-panel-header">
        <div>
          <h2>Find Friends</h2>
          <p className="muted-text">Search users by nickname.</p>
        </div>
      </div>

      <form className="friends-search-form" onSubmit={handleSearch}>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nickname"
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </form>

      {message && <p className="success-text friends-message">{message}</p>}
      {error && <p className="error-text friends-message">{error}</p>}

      {results.length === 0 ? (
        <EmptyState text="No users searched yet" />
      ) : (
        <div className="friends-list">
          {results.map((user) => {
            const label = getRelationshipLabel(user);
            const canSendRequest =
              user.relationship_status === null ||
              user.relationship_status === "rejected";

            return (
              <div key={user.id} className="friend-row">
                <div className="friend-avatar" aria-hidden="true">
                  {user.nickname.charAt(0).toUpperCase()}
                </div>

                <div className="friend-row-main">
                  <h3>{user.nickname}</h3>
                  {label && <p className="muted-text">{label}</p>}
                </div>

                <Button
                  disabled={!canSendRequest}
                  onClick={() => handleSendRequest(user.id)}
                >
                  Add
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
