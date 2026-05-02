# JESAM Transcript-First Traceability Matrix

This matrix enforces requirement precedence:

1. Latest meeting transcript (`9904...Meeting Transcript.pdf`)
2. Older meeting transcript (`69149...Meeting Transcript.pdf`)
3. Proposal (`CMSC 191 - Group 2.pdf`)

Integrations remain simulatable, but workflow/state behavior is strict and auditable.

## Canonical Lifecycle

Submission -> EIC Screening -> Peer Review -> Revision Cycle (if needed) -> Acceptance -> Production/Proofing -> Publication -> Impact/Analytics

## Requirement Mapping

| Requirement | Transcript/Proposal Direction | Implementation Target |
| --- | --- | --- |
| EIC owns initial screening | Latest transcript emphasizes EIC desk decisions | `submission` statuses route directly to EIC screen |
| Similarity/template checks before progression | Both transcripts + proposal | Keep simulated checks with strict gating and metadata capture |
| Reviewer workflow in-system | Transcript asks to avoid email-first process | New `peer-review` module with invite/accept/review cycle |
| Reviewer invite directory | Real accounts for portal visibility | `profiles` users with `role = reviewer` (+ optional `review_expertise` for SESAM focus ranking); invitation email must match login for `/peer-review/reviewer` |
| Reviewer deadlines with flexibility | Proposal has strict SLA; transcript allows extension | Deadlines + reminders with explicit extension control |
| Revision with version control | Proposal + transcripts | New `revision` module with round/version history |
| Production/proof before publish | Proposal + transcripts | Tightened publication gate and proof checkpoint notes |
| Public journal discovery | Transcript asks for website-like browse | New `journals-dashboard` module |
| Analytics dashboard | Proposal module list | New `analytics-dashboard` module |
| AI assistant/summaries | Transcripts + proposal | New `ai-chatbot` + public summary panel |
| Notification trail | Proposal says heavy notifications and logs | Notification + audit snapshots in metadata and logs |

## Public journals URL

- **Canonical discovery route:** `/browse` — registered outside authenticated layout; works for anonymous and signed-in users.
- **Redirects:** `/journals` and `/journals/public` → `/browse`.
- **Header:** Anonymous visitors see **Login** and **Register**. Signed-in users see **Back to workspace** (`getWorkspaceHomePath` in `src/lib/workspace-routing.ts`), account email, and **Sign out**.
- **Data:** Published manuscripts only (`status = Published`). Anonymous reads require Supabase RLS (or equivalent) to allow `SELECT` on published rows for the `anon` role if Row Level Security is enabled.

## Role routing matrix (implementation)

Sidebar entries are driven by `src/lib/nav-permissions.ts` and must stay aligned with `ProtectedRoute` lists in `src/router.tsx`. Modules the role **cannot** access are **omitted** from the sidebar (not disabled placeholders).

| Role | Submission entry | Peer Review | Revision | Publication dashboard | Analytics | Browse |
| --- | --- | --- | --- | --- | --- | --- |
| author | `/author` | not in sidebar | `/revision` | not in sidebar | not in sidebar | `/browse` |
| reviewer | not in sidebar | `/peer-review/reviewer` | not in sidebar | not in sidebar | not in sidebar | `/browse` |
| associate_editor, managing_editor | `/submission/queue` | `/peer-review` (editorial) | `/revision` | not in sidebar | `/analytics` | `/browse` |
| editor_in_chief | `/submission/screening` | `/peer-review` | `/revision` | not in sidebar | `/analytics` | `/browse` |
| production_editor | not in sidebar | not in sidebar | not in sidebar | `/publication/dashboard` | `/analytics` | `/browse` |
| system_admin | `/submission/queue` | `/peer-review` | `/revision` | `/publication/dashboard` | `/analytics` | `/browse` |

Post-login and internal `/` redirect use `getWorkspaceHomePath` (`LoginPage`, `InternalHomeRedirect`): EIC → screening, reviewer → reviewer portal, production → publication dashboard, associate/managing/admin → submission queue, author → `/author`.

## Conflict Resolutions Applied

- Reviewer minimum count: **three (3)** submitted reviews per round gate the editorial decision (`PEER_REVIEW_TARGET_COUNT`), per proposal §2.4. **Request additional reviewer** starts a **new round** with the same per-round minimum. Editors may still resolve conflicting recommendations within a round using consolidated judgment; an extra round is for an additional review cycle when needed.
- Role breadth vs exclusivity: editorial roles can collaborate, but EIC keeps desk-screen authority.
- Admin check duplication: author declaration step retained; editorial duplication removed.
- Deadlines: enforced reminders with configurable extension path.

## Non-Negotiable Acceptance Criteria

1. Submission cannot bypass required metadata, declarations, and checks.
2. EIC can desk reject, return to author, or proceed to peer review.
3. Peer review supports assignment, invitation response, and structured reviewer recommendations.
4. Revision creates versioned rounds (no overwrite-only behavior).
5. Publication requires readiness checks (metadata, file, DOI path).
6. Public article discovery and analytics views are available.
7. AI is assistive-only; final editorial decisions remain human-controlled.
