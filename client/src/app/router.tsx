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
        path: "public-cocktails",
        element: <PublicCocktailsPage />,
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
        ],
      },
    ],
  },
]);
