import type { AppRole } from "@/types";

/**
 * Default authenticated workspace entry path per role.
 * Keep in sync with post-login redirect (`LoginPage`) and internal home (`InternalHomeRedirect`).
 */
export function getWorkspaceHomePath(role: AppRole): string {
  if (role === "editor_in_chief") return "/submission/screening";
  if (role === "reviewer") return "/peer-review/reviewer";
  if (role === "production_editor") return "/publication/dashboard";
  if (role === "associate_editor" || role === "managing_editor" || role === "system_admin") {
    return "/submission/queue";
  }
  return "/author";
}
