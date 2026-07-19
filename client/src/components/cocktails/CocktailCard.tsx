import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { CocktailCardData } from "../../types/cocktail";
import { CocktailCardImage, CocktailCardSummary } from "./CocktailCardParts";
import UserAvatar from "../ui/UserAvatar";

interface CocktailCardProps {
  cocktail: CocktailCardData;
  actions?: ReactNode;
  authorMeta?: ReactNode;
  authorPath?: string;
  className?: string;
  headerActions?: ReactNode;
  showAuthor?: boolean;
  showAuthorHeader?: boolean;
  showIngredientsLabel?: boolean;
  showInstructions?: boolean;
  previewLimit?: number;
  to?: string;
}

export default function CocktailCard({
  cocktail,
  actions,
  authorMeta,
  authorPath,
  className = "",
  headerActions,
  showAuthor = cocktail.type === "public",
  showAuthorHeader = false,
  showIngredientsLabel,
  showInstructions = true,
  previewLimit,
  to,
}: CocktailCardProps) {
  const authorName = cocktail.author_nickname || "User";
  const resolvedAuthorPath = authorPath || to;
  const articleClassName = `cocktail-card ${className}`.trim();
  const authorContent = (
    <>
      <UserAvatar
        nickname={authorName}
        avatar={cocktail.author_avatar}
        className="public-post-avatar"
      />
      <span>
        <strong>{authorName}</strong>
        {authorMeta}
      </span>
    </>
  );
  const content = (
    <>
      <CocktailCardImage cocktail={cocktail} />

      <CocktailCardSummary
        cocktail={cocktail}
        previewLimit={previewLimit}
        showAuthor={showAuthor && !showAuthorHeader}
        showIngredientsLabel={showIngredientsLabel}
        showInstructions={showInstructions}
      />
    </>
  );

  return (
    <article className={articleClassName}>
      {showAuthorHeader && (
        <div className="public-post-header">
          {resolvedAuthorPath ? (
            <Link to={resolvedAuthorPath} className="public-post-author">
              {authorContent}
            </Link>
          ) : (
            <div className="public-post-author">{authorContent}</div>
          )}

          {headerActions}
        </div>
      )}

      {to ? (
        <Link to={to} className="cocktail-card-main">
          {content}
        </Link>
      ) : (
        <div className="cocktail-card-main">{content}</div>
      )}

      {actions}
    </article>
  );
}
