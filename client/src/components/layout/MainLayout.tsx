import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function MainLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <header
        style={{
          height: "64px",
          borderBottom: "1px solid #e5e7eb",
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
        }}
      >
        <Link
          to={isAuthenticated ? "/catalog" : "/login"}
          style={{
            textDecoration: "none",
            color: "#111827",
            fontWeight: 700,
            fontSize: "20px",
          }}
        >
          CocktailApp
        </Link>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {isAuthenticated ? (
            <>
              <Link to="/catalog">Catalog</Link>
              <Link to="/public-cocktails">Public</Link>
              <Link to="/profile">Profile</Link>
              <Link to="/my-cocktails">My Cocktails</Link>
              <Link to="/favorites">Favorites</Link>
              <Link to="/notifications">Notifications</Link>

              {(user?.role === "admin" || user?.role === "superadmin") && (
                <Link to="/admin">Dashboard</Link>
              )}

              <span>{user?.nickname}</span>

              <button
                onClick={handleLogout}
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
          ) : (
            <>
            </>
          )}
        </nav>
      </header>

      <main
        style={{
          minHeight: "calc(100vh - 64px)",
          background: "#f3f6fb",
          padding: "40px 24px",
        }}
      >
        <Outlet />
      </main>
    </>
  );
}
