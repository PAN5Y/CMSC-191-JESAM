import { createBrowserRouter, Navigate, useLocation } from "react-router";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import LoginPage from "./modules/auth/LoginPage";
import RegisterPage from "./modules/auth/RegisterPage";
import UnauthorizedPage from "./components/auth/UnauthorizedPage";
import PublicationDashboard from "./modules/publication-impact/pages/PublicationDashboard";
import ArticleDetail from "./modules/publication-impact/pages/ArticleDetail";
import PublicArticlePage from "./modules/publication-impact/pages/PublicArticlePage";
import JournalsDashboardPage from "./modules/journals-dashboard/pages/JournalsDashboardPage";
import JournalDetailPage from "./modules/journals-dashboard/pages/JournalDetailPage";
import ArticleDetailPage from "./modules/journals-dashboard/pages/ArticleDetailPage";
import SubmissionDashboard from "./modules/submission/pages/SubmissionDashboard";
import SubmissionWorkflow from "./modules/submission/pages/SubmissionWorkflow";
import EditorDashboard from "./modules/submission/pages/EditorDashboard";
import EditorInChiefDashboard from "./modules/submission/pages/EditorInChiefDashboard";
import PeerReviewDashboard from "./modules/peer-review/pages/PeerReviewDashboard";
import ReviewerPortal from "./modules/peer-review/pages/ReviewerPortal";
import RevisionDashboard from "./modules/revision/pages/RevisionDashboard";
import JournalsDashboard from "./modules/journals-dashboard/pages/JournalsDashboard";
import AnalyticsDashboard from "./modules/analytics-dashboard/pages/AnalyticsDashboard";
import AIChatbotPage from "./modules/ai-chatbot/pages/AIChatbotPage";
import { useAuth } from "./contexts/AuthContext";
import { getWorkspaceHomePath } from "./lib/workspace-routing";

function InternalHomeRedirect() {
  const { role } = useAuth();

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getWorkspaceHomePath(role)} replace />;
}

function LegacyJournalsAliasRedirect() {
  const location = useLocation();

  return (
    <Navigate
      to={{
        pathname: "/journals",
        search: location.search,
        hash: location.hash,
      }}
      replace
    />
  );
}

export const router = createBrowserRouter([
  // ── Public routes (no auth required) ──
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  { path: "/journals", element: <JournalsDashboardPage /> },
  { path: "/journals/:journalId", element: <JournalDetailPage /> },
  { path: "/journals/articles/:articleId", element: <ArticleDetailPage /> },
  { path: "/article/public/:id", element: <PublicArticlePage /> },
  { path: "/browse", element: <LegacyJournalsAliasRedirect /> },
  { path: "/journals/public", element: <LegacyJournalsAliasRedirect /> },

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
          "reviewer",
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

  // ── Submission support view (non-EIC) ──
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

  // ── Peer review operations (editorial) ──
  {
    path: "/peer-review",
    element: (
      <ProtectedRoute
        allowedRoles={["associate_editor", "managing_editor", "editor_in_chief", "system_admin"]}
      />
    ),
    children: [
      {
        element: <AppLayout />,
        children: [{ index: true, element: <PeerReviewDashboard /> }],
      },
    ],
  },

  // ── Reviewer portal ──
  {
    path: "/peer-review/reviewer",
    element: <ProtectedRoute allowedRoles={["reviewer", "system_admin"]} />,
    children: [
      {
        element: <AppLayout />,
        children: [{ index: true, element: <ReviewerPortal /> }],
      },
    ],
  },

  // ── Revision cycle ──
  {
    path: "/revision",
    element: (
      <ProtectedRoute
        allowedRoles={["author", "associate_editor", "managing_editor", "editor_in_chief", "system_admin"]}
      />
    ),
    children: [
      {
        element: <AppLayout />,
        children: [{ index: true, element: <RevisionDashboard /> }],
      },
    ],
  },

  // ── Analytics dashboard ──
  {
    path: "/analytics",
    element: (
      <ProtectedRoute
        allowedRoles={["associate_editor", "managing_editor", "production_editor", "editor_in_chief", "system_admin"]}
      />
    ),
    children: [
      {
        element: <AppLayout />,
        children: [{ index: true, element: <AnalyticsDashboard /> }],
      },
    ],
  },

  // ── AI chatbot ──
  {
    path: "/ai-chatbot",
    element: (
      <ProtectedRoute
        allowedRoles={[
          "author",
          "reviewer",
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
        children: [{ index: true, element: <AIChatbotPage /> }],
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
          "reviewer",
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
