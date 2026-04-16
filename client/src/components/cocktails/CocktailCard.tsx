import type { CocktailCardData } from "../../types/cocktail";
import { getImageUrl } from "../../utils/getImageUrl";

interface CocktailCardProps {
  cocktail: CocktailCardData;
}

export default function CocktailCard({ cocktail }: CocktailCardProps) {
  return (
    <article
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          height: "220px",
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

      <div style={{ padding: "18px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "start",
            gap: "12px",
            marginBottom: "10px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "20px", color: "#111827" }}>
            {cocktail.name}
          </h3>

          <span
            style={{
              fontSize: "12px",
              padding: "6px 10px",
              borderRadius: "999px",
              background: "#f3f4f6",
              color: "#374151",
              whiteSpace: "nowrap",
            }}
          >
            {cocktail.category}
          </span>
        </div>

        {cocktail.type === "public" && cocktail.author_nickname && (
          <p style={{ margin: "0 0 10px 0", color: "#6b7280", fontSize: "14px" }}>
            Autor: {cocktail.author_nickname}
          </p>
        )}

        <p style={{ margin: "0 0 10px 0", color: "#374151" }}>
          <strong>Składniki:</strong> {cocktail.ingredients}
        </p>

        <p style={{ margin: 0, color: "#4b5563" }}>
          <strong>Przygotowanie:</strong> {cocktail.instructions}
        </p>
      </div>
    </article>
  );
}