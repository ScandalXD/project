import { useEffect, useMemo, useState } from "react";
import { cocktailsApi } from "../../api/cocktailsApi";
import type { ChatCocktailType } from "../../types/chat";
import type {
  CatalogCocktail,
  PublicCocktail,
  UserCocktail,
} from "../../types/cocktail";
import { getImageUrl } from "../../utils/getImageUrl";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import Select from "../ui/Select";

type ShareableCocktail = {
  id: string;
  name: string;
  image?: string | null;
  type: ChatCocktailType;
};

interface ShareCocktailModalProps {
  onClose: () => void;
  onShare: (cocktailId: string, cocktailType: ChatCocktailType) => Promise<void>;
}

const mapCatalog = (item: CatalogCocktail): ShareableCocktail => ({
  id: item.id,
  name: item.name,
  image: item.image,
  type: "catalog",
});

const mapPublic = (item: PublicCocktail): ShareableCocktail => ({
  id: String(item.id),
  name: item.name,
  image: item.image,
  type: "public",
});

const mapUser = (item: UserCocktail): ShareableCocktail => ({
  id: String(item.id),
  name: item.name,
  image: item.image,
  type: "user",
});

export default function ShareCocktailModal({
  onClose,
  onShare,
}: ShareCocktailModalProps) {
  const [cocktails, setCocktails] = useState<ShareableCocktail[]>([]);
  const [activeType, setActiveType] = useState<ChatCocktailType | "all">("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sharingId, setSharingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [catalog, publicCocktails, userCocktails] = await Promise.all([
          cocktailsApi.getCatalogCocktails(),
          cocktailsApi.getPublicCocktails(),
          cocktailsApi.getMyCocktails(),
        ]);

        setCocktails([
          ...catalog.map(mapCatalog),
          ...publicCocktails.map(mapPublic),
          ...userCocktails.map(mapUser),
        ]);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load cocktails.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const filteredCocktails = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return cocktails.filter((cocktail) => {
      const matchesType = activeType === "all" || cocktail.type === activeType;
      const matchesSearch =
        !searchValue || cocktail.name.toLowerCase().includes(searchValue);

      return matchesType && matchesSearch;
    });
  }, [activeType, cocktails, search]);

  const handleShare = async (cocktail: ShareableCocktail) => {
    setSharingId(`${cocktail.type}:${cocktail.id}`);
    setError("");

    try {
      await onShare(cocktail.id, cocktail.type);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to share cocktail.");
    } finally {
      setSharingId(null);
    }
  };

  return (
    <Modal
      title="Share cocktail"
      onClose={onClose}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      }
    >
      <div className="modal-form">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search cocktails"
        />

        <Select
          value={activeType}
          onChange={(event) =>
            setActiveType(event.target.value as ChatCocktailType | "all")
          }
        >
          <option value="all">All cocktails</option>
          <option value="catalog">Catalog</option>
          <option value="public">Public</option>
          <option value="user">My cocktails</option>
        </Select>

        {error && <p className="error-text">{error}</p>}

        {isLoading ? (
          <p className="muted-text">Loading cocktails...</p>
        ) : filteredCocktails.length === 0 ? (
          <p className="muted-text">No cocktails found.</p>
        ) : (
          <div className="share-cocktail-list">
            {filteredCocktails.map((cocktail) => {
              const shareKey = `${cocktail.type}:${cocktail.id}`;

              return (
                <button
                  key={shareKey}
                  className="share-cocktail-item"
                  disabled={sharingId === shareKey}
                  onClick={() => handleShare(cocktail)}
                >
                  <span className="share-cocktail-image">
                    {cocktail.image && (
                      <img
                        src={getImageUrl(cocktail.image)}
                        alt={cocktail.name}
                      />
                    )}
                  </span>
                  <span>
                    <strong>{cocktail.name}</strong>
                    <small>{cocktail.type}</small>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
