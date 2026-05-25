import { Request, Response } from "express";
import { ServiceError } from "../services/cocktail.service";
import {
  acceptFriendRequest,
  blockUser,
  getBlockedUsers,
  getFriendRequests,
  getFriends,
  rejectFriendRequest,
  removeFriend,
  searchUsersForFriends,
  sendFriendRequest,
  unblockUser,
} from "../services/friend.service";

const handleError = (res: Response, err: unknown) => {
  if (err instanceof ServiceError) {
    return res.status(err.status).json({ message: err.message });
  }

  if (err instanceof Error) {
    return res.status(400).json({ message: err.message });
  }

  return res.status(500).json({ message: "Internal server error" });
};

export const searchUsersHandler = async (
  req: Request<{}, {}, {}, { q?: string }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const users = await searchUsersForFriends(req.user.id, req.query.q ?? "");
    res.json(users);
  } catch (e) {
    handleError(res, e);
  }
};

export const sendFriendRequestHandler = async (
  req: Request<{}, {}, { receiverId: number }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const friendshipId = await sendFriendRequest(
      req.user.id,
      Number(req.body.receiverId),
    );

    res.status(201).json({
      message: "Friend request sent",
      friendshipId,
    });
  } catch (e) {
    handleError(res, e);
  }
};

export const acceptFriendRequestHandler = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await acceptFriendRequest(req.user.id, Number(req.params.id));
    res.json({ message: "Friend request accepted" });
  } catch (e) {
    handleError(res, e);
  }
};

export const rejectFriendRequestHandler = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await rejectFriendRequest(req.user.id, Number(req.params.id));
    res.json({ message: "Friend request rejected" });
  } catch (e) {
    handleError(res, e);
  }
};

export const removeFriendHandler = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await removeFriend(req.user.id, Number(req.params.id));
    res.json({ message: "Friend removed" });
  } catch (e) {
    handleError(res, e);
  }
};

export const blockUserHandler = async (
  req: Request<{}, {}, { userId: number }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await blockUser(req.user.id, Number(req.body.userId));
    res.json({ message: "User blocked" });
  } catch (e) {
    handleError(res, e);
  }
};

export const unblockUserHandler = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    await unblockUser(req.user.id, Number(req.params.id));
    res.json({ message: "User unblocked" });
  } catch (e) {
    handleError(res, e);
  }
};

export const getFriendRequestsHandler = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const requests = await getFriendRequests(req.user.id);
    res.json(requests);
  } catch (e) {
    handleError(res, e);
  }
};

export const getFriendsHandler = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const friends = await getFriends(req.user.id);
    res.json(friends);
  } catch (e) {
    handleError(res, e);
  }
};

export const getBlockedUsersHandler = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const users = await getBlockedUsers(req.user.id);
    res.json(users);
  } catch (e) {
    handleError(res, e);
  }
};
