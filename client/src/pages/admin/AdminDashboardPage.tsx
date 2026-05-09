import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/adminApi";

type DashboardStats = {
  usersCount: number;
  catalogCocktailsCount: number;
  publicCocktailsCount: number;
  pendingCocktailsCount: number;
  openReportsCount: number;
  commentsCount: number;
};

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
    <Link to={to} className="dashboard-card">
      <h3>{title}</h3>
      <p>{value}</p>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
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
    return <p className="error-text">{error}</p>;
  }

  if (!stats) {
    return <p className="muted-text">Loading stats...</p>;
  }

  return (
    <div className="page-container">
      <div className="admin-page-header">
        <h1>Admin Dashboard</h1>
      </div>

      <div className="dashboard-grid">
        <DashboardCard title="Users" value={stats.usersCount} to="/admin/users" />

        <DashboardCard
          title="Catalog cocktails"
          value={stats.catalogCocktailsCount}
          to="/admin/catalog"
        />

        <DashboardCard
          title="Public cocktails"
          value={stats.publicCocktailsCount}
          to="/admin/public"
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