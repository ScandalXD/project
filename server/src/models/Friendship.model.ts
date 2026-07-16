export type FriendshipStatus = "pending" | "accepted" | "rejected" | "blocked";

export interface Friendship {
  id: number;
  requester_id: number;
  receiver_id: number;
  status: FriendshipStatus;
  status_before_block: Exclude<FriendshipStatus, "blocked"> | null;
  blocked_by: number | null;
  created_at: string;
  responded_at: string | null;
  updated_at: string;
  requester_nickname?: string;
  receiver_nickname?: string;
  friend_id?: number;
  friend_nickname?: string;
}

export interface UserSearchResult {
  id: number;
  nickname: string;
  relationship_status: FriendshipStatus | null;
  relationship_direction: "incoming" | "outgoing" | null;
}
