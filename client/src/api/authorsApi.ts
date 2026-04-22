import { api } from "./axios";

export const authorsApi = {
    async getAuthorCocktails(authorId: number | string) {
        const res = await api.get(`/public/authors/${authorId}`);
        return res.data;
    },
};