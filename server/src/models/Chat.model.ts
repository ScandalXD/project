export type ConversationType = "private";

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
}

export interface CocktailShareMetadata {
  cocktailId: string;
  cocktailType: ChatCocktailType;
  cocktailName: string;
  cocktailImage: string | null;
}

export type ChatMessageMetadata =
  | ChatAttachmentMetadata
  | CocktailShareMetadata
  | null;

export interface Conversation {
  id: number;
  type: ConversationType;
  created_at: string;
  updated_at: string;
}

export interface ConversationListItem extends Conversation {
  other_user_id: number;
  other_user_nickname: string;
  is_online: number | boolean;
  last_seen_at: string | null;
  last_message_id: number | null;
  last_message_type: ChatMessageType | null;
  last_message_content: string | null;
  last_message_metadata: string | ChatMessageMetadata | null;
  last_message_created_at: string | null;
  unread_count: number;
  is_pinned: number | boolean;
  is_marked_unread: number | boolean;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  reply_to_message_id: number | null;
  message_type: ChatMessageType;
  content: string | null;
  metadata: string | ChatMessageMetadata | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_edited: number | boolean;
  sender_nickname?: string;
  reply_content?: string | null;
  reply_message_type?: ChatMessageType | null;
}

export interface SendMessageInput {
  messageType: ChatMessageType;
  content?: string | null;
  replyToMessageId?: number | null;
  metadata?: ChatMessageMetadata;
}
