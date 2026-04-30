import { createBrowserRouter, Navigate } from "react-router";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import LoginPage from "./modules/auth/LoginPage";
import RegisterPage from "./modules/auth/RegisterPage";
import UnauthorizedPage from "./components/auth/UnauthorizedPage";
import PublicationDashboard from "./modules/publication-impact/pages/PublicationDashboard";
import ArticleDetail from "./modules/publication-impact/pages/ArticleDetail";
import PublicArticlePage from "./modules/publication-impact/pages/PublicArticlePage";
import SubmissionDashboard from "./modules/submission/pages/SubmissionDashboard";
import SubmissionWorkflow from "./modules/submission/pages/SubmissionWorkflow";
import EditorDashboard from "./modules/submission/pages/EditorDashboard";
import EditorInChiefDashboard from "./modules/submission/pages/EditorInChiefDashboard";
import { useAuth } from "./contexts/AuthContext";

function InternalHomeRedirect() {
  const { role } = useAuth();

  if (role === "editor_in_chief") {
    return <Navigate to="/submission/screening" replace />;
  }

  if (role === "production_editor") {
    return <Navigate to="/publication/dashboard" replace />;
  }

  // Associate/managing editors default to technical intake queue.
  if (role === "associate_editor" || role === "managing_editor") {
    return <Navigate to="/submission/queue" replace />;
  }

  // System admin can start from queue.
  return <Navigate to="/submission/queue" replace />;
}

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
            element: <SubmissionDashboard />,
          },
          {
            path: "submit",
            element: <SubmissionWorkflow />,
          },
          {
            path: "article/:id",
            element: <ArticleDetail />,
          },
        ],
      },
    ],
  },

  // ── Internal landing (role-aware) ──
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
            element: <InternalHomeRedirect />,
          },
        ],
      },
    ],
  },

  // ── Editor technical queue (non-EIC) ──
  {
    path: "/submission/queue",
    element: (
      <ProtectedRoute
        allowedRoles={["associate_editor", "managing_editor", "system_admin"]}
      />
    ),
    children: [
      {
        element: <AppLayout />,
        children: [{ index: true, element: <EditorDashboard /> }],
      },
    ],
  },

  // ── EIC screening ──
  {
    path: "/submission/screening",
    element: <ProtectedRoute allowedRoles={["editor_in_chief", "system_admin"]} />,
    children: [
      {
        element: <AppLayout />,
        children: [{ index: true, element: <EditorInChiefDashboard /> }],
      },
    ],
  },

  // ── Publication / Production routes ──
  {
    path: "/publication/dashboard",
    element: <ProtectedRoute allowedRoles={["production_editor", "system_admin"]} />,
    children: [
      {
        element: <AppLayout />,
        children: [{ index: true, element: <PublicationDashboard /> }],
      },
    ],
  },

  // ── Internal manuscript detail (used by allowed internal roles) ──
  {
    path: "/article/:id",
    element: (
      <ProtectedRoute
        allowedRoles={[
          "associate_editor",
          "managing_editor",
          "production_editor",
          "editor_in_chief",
          "system_admin",
        ]}
      />
    ),
    children: [
      {
        element: <AppLayout />,
        children: [{ index: true, element: <ArticleDetail /> }],
      },
    ],
  },
]);
