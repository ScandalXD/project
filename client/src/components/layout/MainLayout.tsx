import {
  Bell,
  BookOpen,
  Gauge,
  GlassWater,
  Globe2,
  Heart,
  LogOut,
  MessageCircle,
  Users,
} from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const navItems = [
  { to: "/catalog", label: "Catalog", icon: BookOpen },
  { to: "/public-cocktails", label: "Public", icon: Globe2 },
  { to: "/my-cocktails", label: "My Cocktails", icon: GlassWater },
  { to: "/favorites", label: "Favorites", icon: Heart },
  { to: "/friends", label: "Friends", icon: Users },
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

export default function MainLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <header className="app-header">
        <Link to={isAuthenticated ? "/catalog" : "/login"} className="app-brand">
          CocktailApp
        </Link>

        <nav className="app-nav">
          {isAuthenticated ? (
            <>
              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `app-nav-link ${isActive ? "app-nav-link-active" : ""}`
                    }
                    title={item.label}
                  >
                    <Icon size={17} strokeWidth={2.1} aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}

              {(user?.role === "admin" || user?.role === "superadmin") && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `app-nav-link ${isActive ? "app-nav-link-active" : ""}`
                  }
                  title="Dashboard"
                >
                  <Gauge size={17} strokeWidth={2.1} aria-hidden="true" />
                  <span>Dashboard</span>
                </NavLink>
              )}

              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `app-user-badge ${isActive ? "app-user-badge-active" : ""}`
                }
                title="Profile"
              >
                <span className="app-user-avatar" aria-hidden="true">
                  {user?.nickname?.charAt(0).toUpperCase()}
                </span>
                <span>{user?.nickname}</span>
              </NavLink>

              <button
                onClick={handleLogout}
                className="app-logout-button"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={17} strokeWidth={2.2} aria-hidden="true" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
            </>
          )}
        </nav>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </>
  );
}
