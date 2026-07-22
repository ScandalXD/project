import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import RouteErrorBoundary from "../components/ui/RouteErrorBoundary";
import GuestRoute from "../routes/GuestRoute";
import ProtectedRoute from "../routes/ProtectedRoute";
import AdminRoute from "../routes/AdminRoute";

const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const ProfilePage = lazy(() => import("../pages/user/ProfilePage"));
const CatalogPage = lazy(() => import("../pages/public/CatalogPage"));
const PublicCocktailsPage = lazy(() => import("../pages/public/PublicCocktailsPage"));
const MyCocktailsPage = lazy(() => import("../pages/user/MyCocktailsPage"));
const CreateCocktailPage = lazy(() => import("../pages/user/CreateCocktailPage"));
const EditCocktailPage = lazy(() => import("../pages/user/EditCocktailPage"));
const MyCocktailDetailsPage = lazy(() => import("../pages/user/MyCocktailDetailsPage"));
const CatalogCocktailDetailsPage = lazy(() => import("../pages/public/CatalogCocktailDetailsPage"));
const PublicCocktailDetailsPage = lazy(() => import("../pages/public/PublicCocktailDetailsPage"));
const FavoritesPage = lazy(() => import("../pages/user/FavoritesPage"));
const NotificationsPage = lazy(() => import("../pages/user/NotificationsPage"));
const FriendsPage = lazy(() => import("../pages/user/FriendsPage"));
const ChatPage = lazy(() => import("../pages/user/ChatPage"));
const AuthorProfilePage = lazy(() => import("../pages/public/AuthorProfilePage"));
const AdminDashboardPage = lazy(() => import("../pages/admin/AdminDashboardPage"));
const AdminModerationPage = lazy(() => import("../pages/admin/AdminModerationPage"));
const AdminUsersPage = lazy(() => import("../pages/admin/AdminUsersPage"));
const AdminCatalogPage = lazy(() => import("../pages/admin/AdminCatalogPage"));
const AdminReportsPage = lazy(() => import("../pages/admin/AdminReportsPage"));
const AdminCatalogCreatePage = lazy(() => import("../pages/admin/AdminCatalogCreatePage"));
const AdminCatalogEditPage = lazy(() => import("../pages/admin/AdminCatalogEditPage"));
const AdminCommentsPage = lazy(() => import("../pages/admin/AdminCommentsPage"));
const AdminPublicPage = lazy(() => import("../pages/admin/AdminPublicPage"));

function page(element: ReactNode) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<div className="route-loading">Loading...</div>}>
        {element}
      </Suspense>
    </RouteErrorBoundary>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: page(<NotFoundPage />),
    children: [
      { index: true, element: <Navigate to="/catalog" replace /> },

      {
        element: <GuestRoute />,
        children: [
          { path: "login", element: page(<LoginPage />) },
          { path: "register", element: page(<RegisterPage />) },
        ],
      },

      {
        element: <ProtectedRoute />,
        children: [
          { path: "catalog", element: page(<CatalogPage />) },
          { path: "catalog/:id", element: page(<CatalogCocktailDetailsPage />) },
          { path: "public-cocktails", element: page(<PublicCocktailsPage />) },
          { path: "public-cocktails/:id", element: page(<PublicCocktailDetailsPage />) },
          { path: "authors/:authorId", element: page(<AuthorProfilePage />) },
          { path: "profile", element: page(<ProfilePage />) },
          { path: "my-cocktails", element: page(<MyCocktailsPage />) },
          { path: "my-cocktails/create", element: page(<CreateCocktailPage />) },
          { path: "my-cocktails/:id/edit", element: page(<EditCocktailPage />) },
          { path: "my-cocktails/:id", element: page(<MyCocktailDetailsPage />) },
          { path: "favorites", element: page(<FavoritesPage />) },
          { path: "friends", element: page(<FriendsPage />) },
          { path: "chat", element: page(<ChatPage />) },
          { path: "notifications", element: page(<NotificationsPage />) },
        ],
      },

      {
        element: <AdminRoute />,
        children: [
          { path: "admin", element: page(<AdminDashboardPage />) },
          { path: "admin/moderation", element: page(<AdminModerationPage />) },
          { path: "admin/public", element: page(<AdminPublicPage />) },
          { path: "admin/catalog", element: page(<AdminCatalogPage />) },
          { path: "admin/catalog/create", element: page(<AdminCatalogCreatePage />) },
          { path: "admin/catalog/:id/edit", element: page(<AdminCatalogEditPage />) },
          { path: "admin/users", element: page(<AdminUsersPage />) },
          { path: "admin/reports", element: page(<AdminReportsPage />) },
          { path: "admin/comments", element: page(<AdminCommentsPage />) },
          { path: "admin/chat-reports", element: <Navigate to="/admin/reports" replace /> },
        ],
      },
    ],
  },
]);
