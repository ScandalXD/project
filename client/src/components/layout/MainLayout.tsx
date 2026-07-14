import {
  Bell,
  BookOpen,
  Gauge,
  GlassWater,
  Globe2,
  Heart,
  LogOut,
  Menu,
  MessageCircle,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleLogout = () => {
    setIsMobileNavOpen(false);
    logout();
    navigate("/login");
  };

  const closeMobileNav = () => {
    setIsMobileNavOpen(false);
  };

  return (
    <>
      <header className="app-header">
        <Link
          to={isAuthenticated ? "/catalog" : "/login"}
          className="app-brand"
          onClick={closeMobileNav}
        >
          CocktailApp
        </Link>

        {isAuthenticated && (
          <button
            type="button"
            className="app-mobile-menu-button"
            onClick={() => setIsMobileNavOpen((open) => !open)}
            aria-label={isMobileNavOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={isMobileNavOpen}
          >
            {isMobileNavOpen ? (
              <X size={20} aria-hidden="true" />
            ) : (
              <Menu size={20} aria-hidden="true" />
            )}
          </button>
        )}

        <nav className={`app-nav ${isMobileNavOpen ? "app-nav-open" : ""}`}>
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
                    onClick={closeMobileNav}
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
                  onClick={closeMobileNav}
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
                onClick={closeMobileNav}
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
