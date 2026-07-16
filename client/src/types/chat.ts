export type ChatMessageType =
  | "text"
  | "cocktail_share"
  | "image"
  | "file"
  | "voice"
  | "system";

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
  forwardedFromMessageId?: number;
  forwardedFromUserId?: number;
  forwardedFromNickname?: string;
}

export interface CommentShareMetadata {
  sharedType: "comment";
  commentAuthorNickname: string;
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
  is_online: boolean | number;
  last_seen_at: string | null;
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
  reply_content?: string | null;
  reply_message_type?: ChatMessageType | null;
}

export interface MessageReactionSummary {
  emoji: string;
  count: number;
  reactedByMe: boolean;
}
