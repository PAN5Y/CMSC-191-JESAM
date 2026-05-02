import type { LucideIcon } from "lucide-react";
import {
  Upload,
  Users,
  Edit,
  FileCheck,
  BookOpen,
  BarChart3,
  HelpCircle,
} from "lucide-react";
import type { AppRole } from "@/types";

export interface SidebarNavItem {
  icon: LucideIcon;
  label: string;
  to: string;
}

/**
 * Sidebar entries only for routes the role may access (mirrors ProtectedRoute + transcript matrix).
 * Forbidden routes are omitted entirely — no disabled placeholders.
 */
export function getSidebarItems(role: AppRole | null | undefined): SidebarNavItem[] {
  if (!role) {
    return [];
  }

  if (role === "author") {
    return [
      { icon: Upload, label: "Submission", to: "/author" },
      { icon: Edit, label: "Revision", to: "/revision" },
      { icon: BookOpen, label: "Browse journals", to: "/browse" },
      { icon: HelpCircle, label: "AI Chatbot", to: "/ai-chatbot" },
    ];
  }

  if (role === "reviewer") {
    return [
      { icon: Users, label: "Peer Review", to: "/peer-review/reviewer" },
      { icon: BookOpen, label: "Browse journals", to: "/browse" },
      { icon: HelpCircle, label: "AI Chatbot", to: "/ai-chatbot" },
    ];
  }

  if (role === "associate_editor" || role === "managing_editor") {
    return [
      { icon: Upload, label: "Submission", to: "/submission/queue" },
      { icon: Users, label: "Peer Review", to: "/peer-review" },
      { icon: Edit, label: "Revision", to: "/revision" },
      { icon: BookOpen, label: "Browse journals", to: "/browse" },
      { icon: BarChart3, label: "Analytics Dashboard", to: "/analytics" },
      { icon: HelpCircle, label: "AI Chatbot", to: "/ai-chatbot" },
    ];
  }

  if (role === "editor_in_chief") {
    return [
      { icon: Upload, label: "Submission", to: "/submission/screening" },
      { icon: Users, label: "Peer Review", to: "/peer-review" },
      { icon: Edit, label: "Revision", to: "/revision" },
      { icon: BookOpen, label: "Browse journals", to: "/browse" },
      { icon: BarChart3, label: "Analytics Dashboard", to: "/analytics" },
      { icon: HelpCircle, label: "AI Chatbot", to: "/ai-chatbot" },
    ];
  }

  if (role === "production_editor") {
    return [
      { icon: FileCheck, label: "Publication", to: "/publication/dashboard" },
      { icon: BookOpen, label: "Browse journals", to: "/browse" },
      { icon: BarChart3, label: "Analytics Dashboard", to: "/analytics" },
      { icon: HelpCircle, label: "AI Chatbot", to: "/ai-chatbot" },
    ];
  }

  // system_admin — union of operational routes
  return [
    { icon: Upload, label: "Submission", to: "/submission/queue" },
    { icon: Users, label: "Peer Review", to: "/peer-review" },
    { icon: Edit, label: "Revision", to: "/revision" },
    { icon: FileCheck, label: "Publication", to: "/publication/dashboard" },
    { icon: BookOpen, label: "Browse journals", to: "/browse" },
    { icon: BarChart3, label: "Analytics Dashboard", to: "/analytics" },
    { icon: HelpCircle, label: "AI Chatbot", to: "/ai-chatbot" },
  ];
}
