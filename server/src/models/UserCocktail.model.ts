export type PublicationStatus = "draft" | "pending" | "approved" | "rejected";

export interface UserCocktail {
  id: number;
  owner_id: number;
  name: string;
  category: "Alkoholowy" | "Bezalkoholowy";
  ingredients: string;
  instructions: string;
  image: string | null;
  publication_status: PublicationStatus;
  moderation_reason: string | null;
  submitted_at: string | null;
  moderated_at: string | null;
  moderated_by: number | null;
  created_at: string;
}