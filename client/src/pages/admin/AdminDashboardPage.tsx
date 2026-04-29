import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/adminApi";

function DashboardCard({
  title,
  value,
  to,
}: {
  title: string;
  value: number | string;
  to: string;
}) {
  return (
    <Link
      to={to}
      style={{
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #ddd",
          borderRadius: "12px",
          padding: "20px",
          minHeight: "110px",
          cursor: "pointer",
        }}
      >
        <h3>{title}</h3>
        <p style={{ fontSize: "28px", margin: 0 }}>{value}</p>
      </div>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState("");

  const loadStats = async () => {
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch {
      setError("Nie udało się pobrać statystyk.");
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (error) {
    return <p style={{ color: "#dc2626" }}>{error}</p>;
  }

  if (!stats) {
    return <p>Loading stats...</p>;
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <h1>Admin Dashboard</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginTop: "20px",
        }}
      >
        <DashboardCard
          title="Users"
          value={stats.usersCount}
          to="/admin/users"
        />

        <DashboardCard
          title="Catalog cocktails"
          value={stats.catalogCocktailsCount}
          to="/admin/catalog"
        />

        <DashboardCard
          title="Public cocktails"
          value={stats.publicCocktailsCount}
          to="/public-cocktails"
        />

        <DashboardCard
          title="Pending moderation"
          value={stats.pendingCocktailsCount}
          to="/admin/moderation"
        />

        <DashboardCard
          title="Reports"
          value={stats.openReportsCount}
          to="/admin/reports"
        />

        <DashboardCard
          title="Comments"
          value={stats.commentsCount}
          to="/admin/comments"
        />
      </div>
    </div>
  );
}
