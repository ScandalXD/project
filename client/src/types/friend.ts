export type FriendshipStatus = "pending" | "accepted" | "rejected" | "blocked";
export type FriendshipDirection = "incoming" | "outgoing" | null;

export interface FriendSearchResult {
  id: number;
  nickname: string;
  avatar?: string | null;
  relationship_status: FriendshipStatus | null;
  relationship_direction: FriendshipDirection;
}

export interface Friendship {
  id: number;
  requester_id: number;
  receiver_id: number;
  status: FriendshipStatus;
  blocked_by: number | null;
  created_at: string;
  responded_at: string | null;
  updated_at: string;
  requester_nickname?: string;
  requester_avatar?: string | null;
  receiver_nickname?: string;
  receiver_avatar?: string | null;
  friend_id?: number;
  friend_nickname?: string;
  friend_avatar?: string | null;
}

export interface FriendRequestsResponse {
  incoming: Friendship[];
  outgoing: Friendship[];
}
