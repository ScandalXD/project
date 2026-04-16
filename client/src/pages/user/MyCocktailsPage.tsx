import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cocktailsApi } from "../../api/cocktailsApi";
import { getImageUrl } from "../../utils/getImageUrl";
import type { UserCocktail } from "../../types/cocktail";

function getStatusLabel(status: UserCocktail["publication_status"]) {
  if (status === "draft") return "Draft";
  if (status === "pending") return "Pending moderation";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return status;
}

export default function MyCocktailsPage() {
  const [cocktails, setCocktails] = useState<UserCocktail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const navigate = useNavigate();

  const loadCocktails = async () => {
    try {
      const data = await cocktailsApi.getMyCocktails();
      setCocktails(data);
    } catch {
      setError("Nie udało się pobrać Twoich koktajli.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCocktails();
  }, []);

  const handlePublish = async (id: number) => {
    setError("");
    setActionMessage("");

    try {
      await cocktailsApi.publishCocktail(id);
      setActionMessage("Cocktail submitted for moderation.");
      await loadCocktails();
    } catch {
      setError("Nie udało się wysłać koktajlu do moderacji.");
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Czy na pewno chcesz usunąć ten koktajl?");

    if (!confirmed) return;

    setError("");
    setActionMessage("");

    try {
      await cocktailsApi.deleteCocktail(id);
      setActionMessage("Cocktail deleted.");
      await loadCocktails();
    } catch {
      setError("Nie udało się usunąć koktajlu.");
    }
  };

  if (isLoading) {
    return <div>Loading your cocktails...</div>;
  }

  if (error && cocktails.length === 0) {
    return <div style={{ color: "#dc2626" }}>{error}</div>;
  }

  return (
    <section>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 style={{ marginBottom: "8px" }}>My Cocktails</h1>
          <p style={{ color: "#6b7280", margin: 0 }}>
            Zarządzaj swoimi własnymi koktajlami.
          </p>
        </div>

        <Link
          to="/my-cocktails/create"
          style={{
            textDecoration: "none",
            background: "#111827",
            color: "#ffffff",
            padding: "12px 16px",
            borderRadius: "10px",
          }}
        >
          + Create
        </Link>
      </div>

      {actionMessage && (
        <p style={{ color: "#059669", marginBottom: "16px" }}>
          {actionMessage}
        </p>
      )}

      {error && (
        <p style={{ color: "#dc2626", marginBottom: "16px" }}>{error}</p>
      )}

      {cocktails.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            padding: "24px",
            borderRadius: "16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          }}
        >
          Nie masz jeszcze żadnych koktajli.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "18px" }}>
          {cocktails.map((cocktail) => (
            <article
              key={cocktail.id}
              onClick={() => navigate(`/my-cocktails/${cocktail.id}`)}
              style={{
                display: "grid",
                gridTemplateColumns: "220px 1fr",
                gap: "18px",
                background: "#ffffff",
                borderRadius: "18px",
                overflow: "hidden",
                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                border: "1px solid #e5e7eb",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  minHeight: "180px",
                  background: "#eef2ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {cocktail.image ? (
                  <img
                    src={getImageUrl(cocktail.image)}
                    alt={cocktail.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span style={{ color: "#6b7280" }}>No image</span>
                )}
              </div>

              <div style={{ padding: "18px 18px 18px 0" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    gap: "12px",
                    marginBottom: "10px",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "22px", color: "#111827" }}>
                    {cocktail.name}
                  </h3>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        padding: "6px 10px",
                        borderRadius: "999px",
                        background: "#f3f4f6",
                        color: "#374151",
                      }}
                    >
                      {cocktail.category}
                    </span>

                    <span
                      style={{
                        fontSize: "12px",
                        padding: "6px 10px",
                        borderRadius: "999px",
                        background: "#dbeafe",
                        color: "#1d4ed8",
                      }}
                    >
                      {getStatusLabel(cocktail.publication_status)}
                    </span>
                  </div>
                </div>

                <p style={{ margin: "0 0 10px 0", color: "#374151" }}>
                  <strong>Składniki:</strong> {cocktail.ingredients}
                </p>

                <p style={{ margin: "0 0 10px 0", color: "#4b5563" }}>
                  <strong>Przygotowanie:</strong> {cocktail.instructions}
                </p>

                {cocktail.moderation_reason && (
                  <p style={{ margin: "0 0 12px 0", color: "#b91c1c" }}>
                    <strong>Moderation reason:</strong>{" "}
                    {cocktail.moderation_reason}
                  </p>
                )}

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {(cocktail.publication_status === "draft" ||
                    cocktail.publication_status === "rejected") && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePublish(cocktail.id);
                      }}
                      style={{
                        border: "none",
                        background: "#2563eb",
                        color: "#ffffff",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        cursor: "pointer",
                      }}
                    >
                      Publish
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(cocktail.id);
                    }}
                    style={{
                      border: "none",
                      background: "#dc2626",
                      color: "#ffffff",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>

                  <Link
                    to={`/my-cocktails/${cocktail.id}/edit`}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      textDecoration: "none",
                      background: "#f59e0b",
                      color: "#ffffff",
                      padding: "10px 14px",
                      borderRadius: "10px",
                    }}
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}