import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import GuestRoute from "../routes/GuestRoute";
import ProtectedRoute from "../routes/ProtectedRoute";
import HomePage from "../pages/public/HomePage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import NotFoundPage from "../pages/NotFoundPage";
import ProfilePage from "../pages/user/ProfilePage";
import CatalogPage from "../pages/public/CatalogPage";
import PublicCocktailsPage from "../pages/public/PublicCocktailsPage";
import MyCocktailsPage from "../pages/user/MyCocktailsPage";
import CreateCocktailPage from "../pages/user/CreateCocktailPage";
import EditCocktailPage from "../pages/user/EditCocktailPage";
import MyCocktailDetailsPage from "../pages/user/MyCocktailDetailsPage";
import CatalogCocktailDetailsPage from "../pages/public/CatalogCocktailDetailsPage";
import PublicCocktailDetailsPage from "../pages/public/PublicCocktailDetailsPage";
import FavoritesPage from "../pages/user/FavoritesPage";
import NotificationsPage from "../pages/user/NotificationsPage";
import AuthorProfilePage from "../pages/public/AuthorProfilePage";
import AdminRoute from "../routes/AdminRoute";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminModerationPage from "../pages/admin/AdminModerationPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminCatalogPage from "../pages/admin/AdminCatalogPage";
import AdminReportsPage from "../pages/admin/AdminReportsPage";
import AdminCatalogCreatePage from "../pages/admin/AdminCatalogCreatePage";
import AdminCatalogEditPage from "../pages/admin/AdminCatalogEditPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "catalog",
        element: <CatalogPage />,
      },
      {
        path: "catalog/:id",
        element: <CatalogCocktailDetailsPage />,
      },
      {
        path: "public-cocktails",
        element: <PublicCocktailsPage />,
      },
      {
        path: "public-cocktails/:id",
        element: <PublicCocktailDetailsPage />,
      },
      {
        path: "authors/:authorId",
        element: <AuthorProfilePage />,
      },
      {
        element: <GuestRoute />,
        children: [
          {
            path: "login",
            element: <LoginPage />,
          },
          {
            path: "register",
            element: <RegisterPage />,
          },
        ],
      },
      {
        element: <AdminRoute />,
        children: [
          {
            path: "admin",
            element: <AdminDashboardPage />,
          },
          {
            path: "admin/moderation",
            element: <AdminModerationPage />,
          },
          {
            path: "admin/users",
            element: <AdminUsersPage />,
          },
          {
            path: "admin/catalog",
            element: <AdminCatalogPage />,
          },
          {
            path: "admin/reports",
            element: <AdminReportsPage />,
          },
          {
            path: "admin/catalog/create",
            element: <AdminCatalogCreatePage />,
          },
          {
            path: "admin/catalog/:id/edit",
            element: <AdminCatalogEditPage />,
          },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "profile",
            element: <ProfilePage />,
          },
          {
            path: "my-cocktails",
            element: <MyCocktailsPage />,
          },
          {
            path: "my-cocktails/create",
            element: <CreateCocktailPage />,
          },
          {
            path: "my-cocktails/:id/edit",
            element: <EditCocktailPage />,
          },
          {
            path: "my-cocktails/:id",
            element: <MyCocktailDetailsPage />,
          },
          {
            path: "favorites",
            element: <FavoritesPage />,
          },
          {
            path: "notifications",
            element: <NotificationsPage />,
          },
        ],
      },
    ],
  },
]);
