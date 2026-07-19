import { api } from "./axios";
import type {
  ChatAttachmentMessageType,
  ChatCocktailType,
  ChatMessageMetadata,
  ChatMessage,
  ConversationListItem,
} from "../types/chat";

export const chatApi = {
  async getConversations(): Promise<ConversationListItem[]> {
    const res = await api.get("/chat/conversations");
    return res.data;
  },

  async openConversation(friendId: number): Promise<{ conversationId: number }> {
    const res = await api.post("/chat/conversations", { friendId });
    return res.data;
  },

  async getMessages(conversationId: number): Promise<ChatMessage[]> {
    const res = await api.get(`/chat/conversations/${conversationId}/messages`);
    return res.data;
  },

  async sendTextMessage(
    conversationId: number,
    content?: string | null,
    replyToMessageId?: number | null,
    metadata?: ChatMessageMetadata,
  ): Promise<ChatMessage> {
    const res = await api.post(
      `/chat/conversations/${conversationId}/messages/text`,
      {
        content,
        metadata,
        replyToMessageId,
      },
    );

    return res.data;
  },

  async sendCocktailShare(
    conversationId: number,
    cocktailId: string,
    cocktailType: ChatCocktailType,
    content?: string | null,
    replyToMessageId?: number | null,
  ): Promise<ChatMessage> {
    const res = await api.post(
      `/chat/conversations/${conversationId}/messages/cocktail-share`,
      {
        cocktailId,
        cocktailType,
        content,
        replyToMessageId,
      },
    );

    return res.data;
  },

  async sendAttachment(
    conversationId: number,
    file: File,
    messageType: ChatAttachmentMessageType,
    content?: string,
    replyToMessageId?: number | null,
    durationSeconds?: number | null,
    waveformLevels?: number[] | null,
  ): Promise<ChatMessage> {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("messageType", messageType);

    if (content) {
      formData.append("content", content);
    }

    if (replyToMessageId) {
      formData.append("replyToMessageId", String(replyToMessageId));
    }

    if (durationSeconds !== undefined && durationSeconds !== null) {
      formData.append("durationSeconds", String(durationSeconds));
    }

    if (waveformLevels?.length) {
      formData.append("waveformLevels", JSON.stringify(waveformLevels));
    }

    const res = await api.post(
      `/chat/conversations/${conversationId}/messages/attachment`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return res.data;
  },

  async markAsRead(conversationId: number) {
    const res = await api.patch(`/chat/conversations/${conversationId}/read`);
    return res.data;
  },

  async markAsUnread(conversationId: number) {
    const res = await api.patch(`/chat/conversations/${conversationId}/unread`);
    return res.data;
  },

  async pinConversation(conversationId: number) {
    const res = await api.patch(`/chat/conversations/${conversationId}/pin`);
    return res.data;
  },

  async unpinConversation(conversationId: number) {
    const res = await api.patch(`/chat/conversations/${conversationId}/unpin`);
    return res.data;
  },

  async deleteConversation(conversationId: number) {
    const res = await api.delete(`/chat/conversations/${conversationId}`);
    return res.data;
  },

  async deleteConversationForEveryone(conversationId: number) {
    const res = await api.delete(`/chat/conversations/${conversationId}/everyone`);
    return res.data;
  },

  async deleteMessage(messageId: number) {
    const res = await api.delete(`/chat/messages/${messageId}`);
    return res.data;
  },

  async deleteMessageForEveryone(messageId: number) {
    const res = await api.delete(`/chat/messages/${messageId}/everyone`);
    return res.data;
  },

  async editMessage(messageId: number, content: string): Promise<ChatMessage> {
    const res = await api.patch(`/chat/messages/${messageId}`, { content });
    return res.data;
  },

  async forwardMessage(
    messageId: number,
    conversationId: number,
  ): Promise<ChatMessage> {
    const res = await api.post(`/chat/messages/${messageId}/forward`, {
      conversationId,
    });
    return res.data;
  },

  async setMessageReaction(
    messageId: number,
    emoji: string,
  ): Promise<ChatMessage> {
    const res = await api.put(`/chat/messages/${messageId}/reaction`, { emoji });
    return res.data;
  },

  async removeMessageReaction(messageId: number): Promise<ChatMessage> {
    const res = await api.delete(`/chat/messages/${messageId}/reaction`);
    return res.data;
  },

  async pinMessage(messageId: number): Promise<ChatMessage> {
    const res = await api.patch(`/chat/messages/${messageId}/pin`);
    return res.data;
  },

  async unpinMessage(messageId: number): Promise<ChatMessage> {
    const res = await api.patch(`/chat/messages/${messageId}/unpin`);
    return res.data;
  },
};
