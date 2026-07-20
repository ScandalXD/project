import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { adminApi } from "../../api/adminApi";
import { cocktailsApi } from "../../api/cocktailsApi";
import CocktailCard from "../../components/cocktails/CocktailCard";
import Button from "../../components/ui/Button";
import BackButton from "../../components/ui/BackButton";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import type { PublicCocktail } from "../../types/cocktail";

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

export default function AdminPublicPage() {
  const [items, setItems] = useState<PublicCocktail[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch = query
        ? item.name.toLowerCase().includes(query)
        : true;
      const matchesCategory =
        category === "all" ? true : item.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [category, items, search]);

  const loadPublic = async () => {
    try {
      const data = await cocktailsApi.getPublicCocktails();
      setItems(data);
    } catch {
      setError("Failed to load public cocktails.");
    }
  };

  useEffect(() => {
    loadPublic();
  }, []);

  const handleDelete = async () => {
    if (!deleteId || !deleteReason.trim()) return;

    setError("");
    setMessage("");

    try {
      await adminApi.deletePublicCocktail(deleteId, deleteReason.trim());
      setMessage("Public cocktail deleted.");
      setDeleteId(null);
      setDeleteReason("");
      setActiveMenuId(null);
      await loadPublic();
    } catch {
      setError("Failed to delete public cocktail.");
    }
  };

  return (
    <div className="page-container">
      <BackButton to="/admin" label="Dashboard" />

      <div className="catalog-header">
        <div>
          <h1>Admin Public Cocktails</h1>
          <p className="muted-text">
            Review and manage cocktails published by users.
          </p>
        </div>

        <div className="catalog-filters">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cocktails..."
          />

          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All categories</option>
            <option value="Alkoholowy">Alcoholic</option>
            <option value="Bezalkoholowy">Non-alcoholic</option>
          </Select>
        </div>
      </div>

      {message && <p className="success-text">{message}</p>}
      {error && <p className="error-text">{error}</p>}

      {filteredItems.length === 0 ? (
        <EmptyState
          text={items.length === 0 ? "No public cocktails" : "No cocktails found"}
        />
      ) : (
        <div className="catalog-grid">
          {filteredItems.map((item) => {
            const authorMeta = item.created_at ? (
              <span className="public-post-time">
                {" "}
                - {formatPostAge(item.created_at)}
              </span>
            ) : null;
            const headerActions = (
              <div className="public-post-menu">
                <button
                  type="button"
                  className="public-post-menu-trigger"
                  onClick={() =>
                    setActiveMenuId((current) =>
                      current === item.id ? null : item.id
                    )
                  }
                  aria-label="Open admin actions"
                  title="More"
                >
                  <MoreHorizontal size={22} aria-hidden="true" />
                </button>

                {activeMenuId === item.id && (
                  <div className="public-post-menu-popover">
                    <button
                      type="button"
                      className="public-post-menu-danger"
                      onClick={() => {
                        setDeleteId(Number(item.id));
                        setDeleteReason("");
                        setActiveMenuId(null);
                      }}
                    >
                      <span>Delete</span>
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            );

            return (
              <CocktailCard
                key={item.id}
                cocktail={{ ...item, type: "public" }}
                authorMeta={authorMeta}
                authorPath={
                  item.author_id ? `/authors/${item.author_id}` : undefined
                }
                className="public-post-card"
                headerActions={headerActions}
                previewLimit={120}
                showAuthorHeader
                showIngredientsLabel={false}
                showInstructions={false}
              />
            );
          })}
        </div>
      )}

      {deleteId && (
        <Modal
          title="Delete public cocktail"
          onClose={() => {
            setDeleteId(null);
            setDeleteReason("");
          }}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setDeleteId(null);
                  setDeleteReason("");
                }}
              >
                Cancel
              </Button>

              <Button
                variant="danger"
                disabled={!deleteReason.trim()}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </>
          }
        >
          <p className="muted-text">Provide reason for deletion:</p>

          <Input
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            placeholder="Admin reason"
          />
        </Modal>
      )}
    </div>
  );
}
