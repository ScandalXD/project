import { useEffect, useState } from "react";
import {
  Bookmark,
  Copy,
  Flag,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cocktailsApi } from "../../api/cocktailsApi";
import { favoritesApi } from "../../api/favoritesApi";
import { likesApi } from "../../api/likesApi";
import { reportApi } from "../../api/reportApi";
import { formatCocktailCategory } from "../../utils/formatCocktailCategory";
import { getImageUrl } from "../../utils/getImageUrl";
import { useAuth } from "../../hooks/useAuth";
import type { PublicCocktail } from "../../types/cocktail";

import CocktailShareModal from "../../components/cocktails/CocktailShareModal";
import EmptyState from "../../components/ui/EmptyState";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import UserAvatar from "../../components/ui/UserAvatar";
import ReportModal from "../../components/reports/ReportModal";

function normalizeFavorites(data: any, type: "catalog" | "public") {
  const list = Array.isArray(data) ? data : data.favorites || data.items || [];

  return list
    .filter((f: any) => {
      const favoriteType = f.cocktail_type || f.cocktailType || f.type;
      return favoriteType === type;
    })
    .map((f: any) =>
      String(f.cocktail_id || f.cocktailId || f.cocktailIdValue || f.id)
    );
}

function formatPostAge(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();

  if (Number.isNaN(date.getTime()) || diffMs < 0) {
    return "";
  }

  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} min.`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} h.`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return `${diffDays} d.`;
  }

  return `${Math.floor(diffDays / 7)} w.`;
}

export default function PublicCocktailsPage() {
  const { isAuthenticated } = useAuth();

  const [items, setItems] = useState<PublicCocktail[]>([]);
  const [filteredItems, setFilteredItems] = useState<PublicCocktail[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const [favorites, setFavorites] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [likesCount, setLikesCount] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [reportCocktailId, setReportCocktailId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportError, setReportError] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [shareCocktail, setShareCocktail] = useState<PublicCocktail | null>(
    null
  );

  const load = async () => {
    try {
      const data = await cocktailsApi.getPublicCocktails();
      setItems(data);

      const counts: Record<string, number> = {};

      await Promise.all(
        data.map(async (item) => {
          const id = String(item.id);
          counts[id] = await likesApi.getLikesCount("public", item.id);
        })
      );

      setLikesCount(counts);

      if (isAuthenticated) {
        const favs = await favoritesApi.getFavorites();
        setFavorites(normalizeFavorites(favs, "public"));

        const liked: string[] = [];

        await Promise.all(
          data.map(async (item) => {
            const id = String(item.id);
            const isLiked = await likesApi.isLikedByUser("public", item.id);

            if (isLiked) {
              liked.push(id);
            }
          })
        );

        setLikedIds(liked);
      } else {
        setFavorites([]);
        setLikedIds([]);
      }
    } catch {
      setError("Failed to load public cocktails.");
    }
  };

  useEffect(() => {
    load();
  }, [isAuthenticated]);

  useEffect(() => {
    let result = [...items];

    if (search.trim()) {
      const q = search.toLowerCase();

      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.ingredients.toLowerCase().includes(q) ||
          (item.author_nickname ?? "").toLowerCase().includes(q)
      );
    }

    if (category !== "all") {
      result = result.filter((item) => item.category === category);
    }

    setFilteredItems(result);
  }, [items, search, category]);

  const toggleFavorite = async (cocktailId: number) => {
    const id = String(cocktailId);

    try {
      if (favorites.includes(id)) {
        await favoritesApi.removeFavorite(cocktailId, "public");
        setFavorites((prev) => prev.filter((itemId) => itemId !== id));
      } else {
        await favoritesApi.addFavorite(cocktailId, "public");
        setFavorites((prev) => [...prev, id]);
      }
    } catch {
      setError("Failed to update favorites.");
    }
  };

  const toggleLike = async (cocktailId: number) => {
    if (!isAuthenticated) return;

    const id = String(cocktailId);

    try {
      if (likedIds.includes(id)) {
        await likesApi.removeLike("public", cocktailId);

        setLikedIds((prev) => prev.filter((itemId) => itemId !== id));
        setLikesCount((prev) => ({
          ...prev,
          [id]: Math.max((prev[id] ?? 1) - 1, 0),
        }));
      } else {
        await likesApi.addLike("public", cocktailId);

        setLikedIds((prev) => [...prev, id]);
        setLikesCount((prev) => ({
          ...prev,
          [id]: (prev[id] ?? 0) + 1,
        }));
      }
    } catch {
      setError("Failed to update like.");
    }
  };

  const openShareModal = (cocktail: PublicCocktail) => {
    setActiveMenuId(null);
    setShareCocktail(cocktail);
  };

  const handleCopyLink = async (cocktailId: number) => {
    setActiveMenuId(null);
    await navigator.clipboard.writeText(
      `${window.location.origin}/public-cocktails/${cocktailId}`
    );
  };

  const openReportModal = (cocktailId: number) => {
    setActiveMenuId(null);
    setReportCocktailId(cocktailId);
    setReportReason("");
    setReportError("");
  };

  const closeReportModal = () => {
    setReportCocktailId(null);
    setReportReason("");
    setReportError("");
  };

  const handleReportSubmit = async () => {
    if (!reportCocktailId || !reportReason.trim()) return;

    setIsReporting(true);
    setReportError("");

    try {
      await reportApi.reportCocktail(reportCocktailId, reportReason.trim());
      closeReportModal();
    } catch (error: any) {
      setReportError(error.response?.data?.message || "Failed to send report");
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="catalog-header">
        <div>
          <h1>Public Cocktails</h1>
          <p className="muted-text">
            Cocktails published by the user community.
          </p>
        </div>

        <div className="catalog-filters">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cocktails..."
          />

          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            <option value="Alkoholowy">Alcoholic</option>
            <option value="Bezalkoholowy">Non-alcoholic</option>
          </Select>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      {filteredItems.length === 0 ? (
        <EmptyState text="No public cocktails found" />
      ) : (
        <div className="catalog-grid">
          {filteredItems.map((item) => {
            const id = String(item.id);
            const authorName = item.author_nickname || "User";

            return (
              <article
                key={item.id}
                className="cocktail-card public-post-card"
              >
                <div className="public-post-header">
                  <Link
                    to={
                      item.author_id
                        ? `/authors/${item.author_id}`
                        : `/public-cocktails/${item.id}`
                    }
                    className="public-post-author"
                  >
                    <UserAvatar
                      nickname={authorName}
                      avatar={item.author_avatar}
                      className="public-post-avatar"
                    />
                    <span>
                      <strong>{authorName}</strong>
                      {item.created_at && (
                        <span className="public-post-time">
                          {" "}
                          - {formatPostAge(item.created_at)}
                        </span>
                      )}
                    </span>
                  </Link>

                  <div className="public-post-menu">
                    <button
                      type="button"
                      className="public-post-menu-trigger"
                      onClick={() =>
                        setActiveMenuId((current) =>
                          current === item.id ? null : item.id
                        )
                      }
                      aria-label="Open cocktail actions"
                      title="More"
                    >
                      <MoreHorizontal size={22} aria-hidden="true" />
                    </button>

                    {activeMenuId === item.id && (
                      <div className="public-post-menu-popover">
                        <button
                          type="button"
                          onClick={() => openShareModal(item)}
                        >
                          <span>Share</span>
                          <Share2 size={18} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(Number(item.id))}
                        >
                          <span>Copy link</span>
                          <Copy size={18} aria-hidden="true" />
                        </button>
                        {isAuthenticated && (
                          <button
                            type="button"
                            className="public-post-menu-danger"
                            onClick={() => openReportModal(Number(item.id))}
                          >
                            <span>Report</span>
                            <Flag size={18} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  to={`/public-cocktails/${item.id}`}
                  className="cocktail-card-main"
                >
                  {item.image && (
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      className="cocktail-card-image"
                    />
                  )}

                  <div className="cocktail-card-body">
                    <h3>{item.name}</h3>

                    <p className="muted-text">
                      {formatCocktailCategory(item.category)}
                    </p>

                    <p className="cocktail-preview public-post-caption">
                      {item.ingredients.length > 120
                        ? `${item.ingredients.slice(0, 120)}...`
                        : item.ingredients}
                    </p>
                  </div>
                </Link>

                {isAuthenticated && (
                  <div className="cocktail-social-actions">
                    <button
                      type="button"
                      className={likedIds.includes(id) ? "is-active" : ""}
                      onClick={() => toggleLike(Number(item.id))}
                      aria-label="Like cocktail"
                      title="Like"
                    >
                      <Heart
                        size={24}
                        fill={likedIds.includes(id) ? "currentColor" : "none"}
                        aria-hidden="true"
                      />
                      <span>{likesCount[id] ?? 0}</span>
                    </button>

                    <Link
                      to={`/public-cocktails/${item.id}`}
                      aria-label="Open comments"
                      title="Comments"
                    >
                      <MessageCircle size={24} aria-hidden="true" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => openShareModal(item)}
                      aria-label="Share cocktail"
                      title="Share"
                    >
                      <Send size={24} aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      className={`cocktail-save-action ${
                        favorites.includes(id) ? "is-active" : ""
                      }`}
                      onClick={() => toggleFavorite(Number(item.id))}
                      aria-label={
                        favorites.includes(id)
                          ? "Remove from favorites"
                          : "Save to favorites"
                      }
                      title={favorites.includes(id) ? "Saved" : "Save"}
                    >
                      <Bookmark size={24} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {reportCocktailId && (
        <ReportModal
          type="cocktail"
          reason={reportReason}
          error={reportError}
          isLoading={isReporting}
          onReasonChange={setReportReason}
          onClose={closeReportModal}
          onSubmit={handleReportSubmit}
        />
      )}

      {shareCocktail && (
        <CocktailShareModal
          cocktailId={shareCocktail.id}
          cocktailName={shareCocktail.name}
          cocktailType="public"
          detailsPath={`/public-cocktails/${shareCocktail.id}`}
          onClose={() => setShareCocktail(null)}
        />
      )}
    </div>
  );
}
