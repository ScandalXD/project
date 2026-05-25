import { api } from "./axios";
import type {
  FriendRequestsResponse,
  FriendSearchResult,
  Friendship,
} from "../types/friend";

export const friendsApi = {
  async searchUsers(query: string): Promise<FriendSearchResult[]> {
    const res = await api.get("/friends/search", {
      params: { q: query },
    });

    return res.data;
  },

  async getFriends(): Promise<Friendship[]> {
    const res = await api.get("/friends");
    return res.data;
  },

  async getFriendRequests(): Promise<FriendRequestsResponse> {
    const res = await api.get("/friends/requests");
    return res.data;
  },

  async getBlockedUsers(): Promise<Friendship[]> {
    const res = await api.get("/friends/blocked");
    return res.data;
  },

  async sendFriendRequest(receiverId: number) {
    const res = await api.post("/friends/requests", { receiverId });
    return res.data;
  },

  async acceptFriendRequest(friendshipId: number) {
    const res = await api.patch(`/friends/requests/${friendshipId}/accept`);
    return res.data;
  },

  async rejectFriendRequest(friendshipId: number) {
    const res = await api.patch(`/friends/requests/${friendshipId}/reject`);
    return res.data;
  },

  async removeFriend(friendId: number) {
    const res = await api.delete(`/friends/${friendId}`);
    return res.data;
  },

  async blockUser(userId: number) {
    const res = await api.post("/friends/block", { userId });
    return res.data;
  },

  async unblockUser(userId: number) {
    const res = await api.delete(`/friends/blocked/${userId}`);
    return res.data;
  },
};
