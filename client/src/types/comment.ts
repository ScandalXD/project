export type CommentCocktailType = "catalog" | "public";

export interface CommentItemData {
    id: number;
    user_id: number;
    cocktail_id:  string;
    cocktail_type: CommentCocktailType;
    content: string;
    parent_comment_id: number | null;
    created_at: string;
    author_nickname: string;
    likes_count: number;
    is_liked_by_user: boolean;
    replies: CommentItemData[];
}