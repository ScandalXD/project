export type CocktailType = "catalog" | "public";
export type CocktailCategory = "Alkoholowy" | "Bezalkoholowy";
export type PublicationStatus = "draft" | "pending" | "approved" | "rejected";

export interface BaseCocktail {
  id: string | number;
  name: string;
  category: CocktailCategory | string;
  ingredients: string;
  instructions: string;
  image?: string | null;
  created_at?: string;
}

export interface CatalogCocktail extends BaseCocktail {
  id: string;
}

export interface PublicCocktail extends BaseCocktail {
  id: number;
  author_id?: number;
  author_nickname?: string;
  source_cocktail_id?: number;
}

export interface UserCocktail extends BaseCocktail {
  id: number;
  owner_id: number;
  publication_status: PublicationStatus;
  moderation_reason?: string | null;
  submitted_at?: string | null;
  moderated_at?: string | null;
  moderated_by?: number | null;
}

export interface CocktailCardData extends BaseCocktail {
  type: CocktailType;
  author_nickname?: string;
}

export interface CreateCocktailRequest {
  name: string;
  category: CocktailCategory;
  ingredients: string;
  instructions: string;
  image?: File | null;
}