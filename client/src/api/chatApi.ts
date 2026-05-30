import { api } from "./axios";
import type {
  ChatCocktailType,
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
    content: string,
    replyToMessageId?: number | null,
  ): Promise<ChatMessage> {
    const res = await api.post(
      `/chat/conversations/${conversationId}/messages/text`,
      {
        content,
        replyToMessageId,
      },
    );

    return res.data;
  },

  async sendCocktailShare(
    conversationId: number,
    cocktailId: string,
    cocktailType: ChatCocktailType,
    replyToMessageId?: number | null,
  ): Promise<ChatMessage> {
    const res = await api.post(
      `/chat/conversations/${conversationId}/messages/cocktail-share`,
      {
        cocktailId,
        cocktailType,
        replyToMessageId,
      },
    );

    return res.data;
  },

  async sendAttachment(
    conversationId: number,
    file: File,
    messageType: "image" | "file" | "voice",
    content?: string,
    replyToMessageId?: number | null,
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
};
