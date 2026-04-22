import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function MainLayout() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div
      style={{ minHeight: "100vh", background: "#f5f7fb", color: "#1f2937" }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Link
          to="/"
          style={{
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "20px",
            color: "#111827",
          }}
        >
          CocktailApp
        </Link>

        <nav style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <Link to="/" style={{ textDecoration: "none", color: "#374151" }}>
            Home
          </Link>

          <Link
            to="/catalog"
            style={{ textDecoration: "none", color: "#374151" }}
          >
            Catalog
          </Link>

          <Link
            to="/public-cocktails"
            style={{ textDecoration: "none", color: "#374151" }}
          >
            Public
          </Link>

          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                style={{ textDecoration: "none", color: "#374151" }}
              >
                Login
              </Link>
              <Link
                to="/register"
                style={{ textDecoration: "none", color: "#374151" }}
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/profile"
                style={{ textDecoration: "none", color: "#374151" }}
              >
                Profile
              </Link>
              <Link
                to="/my-cocktails"
                style={{ textDecoration: "none", color: "#374151" }}
              >
                My Cocktails
              </Link>
              <Link
                to="/favorites"
                style={{ textDecoration: "none", color: "#374151" }}
              >
                Favorites
              </Link>
              <Link
                to="/notifications"
                style={{ textDecoration: "none", color: "#374151" }}
              >
                Notifications
              </Link>
              <span style={{ color: "#374151" }}>{user?.nickname}</span>
              <button
                onClick={logout}
                style={{
                  border: "none",
                  background: "#111827",
                  color: "#ffffff",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </header>

      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px" }}>
        <Outlet />
      </main>
    </div>
  );
}
