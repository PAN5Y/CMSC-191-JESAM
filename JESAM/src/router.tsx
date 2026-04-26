import { createBrowserRouter, Navigate } from "react-router";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import LoginPage from "./modules/auth/LoginPage";
import RegisterPage from "./modules/auth/RegisterPage";
import UnauthorizedPage from "./components/auth/UnauthorizedPage";
import PublicationDashboard from "./modules/publication-impact/pages/PublicationDashboard";
import ArticleDetail from "./modules/publication-impact/pages/ArticleDetail";
import PublicArticlePage from "./modules/publication-impact/pages/PublicArticlePage";

export const router = createBrowserRouter([
  // ── Public routes (no auth required) ──
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  { path: "/article/public/:id", element: <PublicArticlePage /> },

  // ── Author-only routes ──
  {
    path: "/author",
    element: <ProtectedRoute allowedRoles={["author"]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <PublicationDashboard />,
          },
          {
            path: "article/:id",
            element: <ArticleDetail />,
          },
        ],
      },
    ],
  },

  // ── Editor / Admin routes ──
  {
    path: "/",
    element: (
      <ProtectedRoute
        allowedRoles={[
          "production_editor",
          "managing_editor",
          "associate_editor",
          "editor_in_chief",
          "system_admin",
        ]}
      />
    ),
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/publication/dashboard" replace />,
          },
          {
            path: "publication/dashboard",
            element: <PublicationDashboard />,
          },
          {
            path: "article/:id",
            element: <ArticleDetail />,
          },
        ],
      },
    ],
  },
]);
