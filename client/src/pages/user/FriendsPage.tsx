import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { chatApi } from "../../api/chatApi";
import { friendsApi } from "../../api/friendsApi";
import FriendRequests from "../../components/friends/FriendRequests";
import FriendSearch from "../../components/friends/FriendSearch";
import FriendsList from "../../components/friends/FriendsList";
import type { FriendRequestsResponse, Friendship } from "../../types/friend";

export default function FriendsPage() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<Friendship[]>([]);
  const [requests, setRequests] = useState<FriendRequestsResponse>({
    incoming: [],
    outgoing: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadFriendsData = async () => {
    try {
      setError("");

      const [friendsData, requestsData, blockedData] = await Promise.all([
        friendsApi.getFriends(),
        friendsApi.getFriendRequests(),
        friendsApi.getBlockedUsers(),
      ]);

      setFriends(friendsData);
      setRequests(requestsData);
      setBlockedUsers(blockedData);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load friends.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFriendsData();
  }, []);

  const runAction = async (
    action: () => Promise<void>,
    successMessage: string,
  ) => {
    setError("");
    setMessage("");

    try {
      await action();
      setMessage(successMessage);
      await loadFriendsData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Action failed.");
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="empty-state">Loading friends...</div>
      </div>
    );
  }

  return (
    <div className="page-container friends-page">
      <div className="section-header friends-page-header">
        <div>
          <h1>Friends</h1>
          <p className="muted-text">
            Find users, manage requests, and keep your friend list tidy.
          </p>
        </div>
      </div>

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="friends-layout">
        <FriendSearch onChanged={loadFriendsData} />

        <FriendRequests
          incoming={requests.incoming}
          outgoing={requests.outgoing}
          onAccept={(friendshipId) =>
            runAction(
              () => friendsApi.acceptFriendRequest(friendshipId),
              "Friend request accepted.",
            )
          }
          onReject={(friendshipId) =>
            runAction(
              () => friendsApi.rejectFriendRequest(friendshipId),
              "Friend request rejected.",
            )
          }
        />

        <FriendsList
          friends={friends}
          blockedUsers={blockedUsers}
          onMessage={(friendId) =>
            runAction(async () => {
              const { conversationId } = await chatApi.openConversation(friendId);
              navigate(`/chat?conversationId=${conversationId}`);
            }, "Conversation opened.")
          }
          onRemove={(friendId) =>
            runAction(
              () => friendsApi.removeFriend(friendId),
              "Friend removed.",
            )
          }
          onBlock={(userId) =>
            runAction(() => friendsApi.blockUser(userId), "User blocked.")
          }
          onUnblock={(userId) =>
            runAction(() => friendsApi.unblockUser(userId), "User unblocked.")
          }
        />
      </div>
    </div>
  );
}
