export type ChatMessageType =
  | "text"
  | "cocktail_share"
  | "image"
  | "video"
  | "file"
  | "voice"
  | "system";

export type ChatAttachmentMessageType = Extract<
  ChatMessageType,
  "image" | "video" | "file" | "voice"
>;

export type ChatCocktailType = "catalog" | "public" | "user";

export interface ChatAttachmentMetadata {
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  durationSeconds?: number | null;
  waveformLevels?: number[];
  forwardedFromMessageId?: number;
  forwardedFromUserId?: number;
  forwardedFromNickname?: string;
}

export interface CocktailShareMetadata {
  cocktailId: string;
  cocktailType: ChatCocktailType;
  cocktailName: string;
  cocktailImage: string | null;
  authorId?: number | null;
  authorNickname?: string | null;
  authorAvatar?: string | null;
  forwardedFromMessageId?: number;
  forwardedFromUserId?: number;
  forwardedFromNickname?: string;
}

export interface CommentShareMetadata {
  sharedType: "comment";
  commentAuthorNickname: string;
  commentAuthorAvatar?: string | null;
  commentContent: string;
  commentPath: string;
  postTitle: string;
  postImage: string | null;
  postPath: string;
  forwardedFromMessageId?: number;
  forwardedFromUserId?: number;
  forwardedFromNickname?: string;
}

export type ChatMessageMetadata =
  | ChatAttachmentMetadata
  | CocktailShareMetadata
  | CommentShareMetadata
  | null;

export interface ConversationListItem {
  id: number;
  type: "private";
  created_at: string;
  updated_at: string;
  other_user_id: number;
  other_user_nickname: string;
  other_user_avatar?: string | null;
  is_online: boolean | number;
  last_seen_at: string | null;
  friendship_status: "pending" | "accepted" | "rejected" | "blocked" | null;
  friendship_blocked_by: number | null;
  last_message_id: number | null;
  last_message_type: ChatMessageType | null;
  last_message_content: string | null;
  last_message_metadata: ChatMessageMetadata;
  last_message_created_at: string | null;
  unread_count: number;
  is_pinned: boolean | number;
  is_marked_unread: boolean | number;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  reply_to_message_id: number | null;
  message_type: ChatMessageType;
  content: string | null;
  metadata: ChatMessageMetadata;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_edited: boolean | number;
  is_read_by_recipient?: boolean | number;
  is_pinned?: boolean | number;
  reactions?: MessageReactionSummary[];
  sender_nickname?: string;
  sender_avatar?: string | null;
  reply_content?: string | null;
  reply_message_type?: ChatMessageType | null;
}

export interface MessageReactionSummary {
  emoji: string;
  count: number;
  reactedByMe: boolean;
}
