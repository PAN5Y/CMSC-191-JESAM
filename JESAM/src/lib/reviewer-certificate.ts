import type { User } from "@supabase/supabase-js";

export interface ReviewerCertificateInput {
  reviewerName: string;
  reviewerEmail: string;
  manuscriptReference: string;
  manuscriptTitle: string;
  completedAtIso: string;
}

export function reviewerDisplayNameFromUser(user: User | null): string {
  const m = user?.user_metadata as Record<string, string | undefined> | undefined;
  if (!m) return user?.email?.trim() || "Reviewer";
  const parts = [m.first_name, m.middle_name, m.last_name, m.suffix].filter(Boolean);
  const s = parts.join(" ").trim();
  return s || user?.email?.trim() || "Reviewer";
}

/**
 * Opens a print dialog with a simple certificate (MVP). Replace HTML with SESAM template when available.
 */
export function openReviewerCertificatePrint(input: ReviewerCertificateInput): void {
  const completed = new Date(input.completedAtIso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const escapedTitle = escapeHtml(input.manuscriptTitle);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Certificate of peer review — ${escapeHtml(input.manuscriptReference)}</title>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; margin: 48px; color: #1a1c1c; }
    h1 { font-size: 1.35rem; text-align: center; margin-bottom: 8px; color: #3f4b7e; }
    .sub { text-align: center; font-size: 0.9rem; color: #555; margin-bottom: 36px; }
    .block { margin: 24px 0; line-height: 1.5; }
    .sig { margin-top: 48px; border-top: 1px solid #333; width: 280px; padding-top: 8px; font-size: 0.85rem; }
    @media print { body { margin: 24px; } }
  </style>
</head>
<body>
  <h1>Certificate of peer review</h1>
  <p class="sub">Journal of Environmental Science and Management (JESAM)</p>
  <div class="block">
    <p>This certifies that</p>
    <p><strong>${escapeHtml(input.reviewerName)}</strong><br />
    <span style="font-size:0.9rem;color:#555">${escapeHtml(input.reviewerEmail)}</span></p>
    <p>completed a peer review for manuscript <strong>${escapeHtml(input.manuscriptReference)}</strong> on <strong>${escapeHtml(completed)}</strong>.</p>
  </div>
  <div class="block">
    <p style="font-size:0.9rem;"><strong>Title:</strong> ${escapedTitle}</p>
  </div>
  <p style="font-size:0.85rem;color:#555;">Assistive-only document for stakeholder workflow (Group 2 / SESAM). Final records remain in the editorial system.</p>
  <div class="sig">JESAM Editorial Office</div>
  <p style="font-size:0.8rem;margin-top:24px;">Use your browser <strong>Print</strong> dialog to print or save as PDF.</p>
</body>
</html>`;

  // Do not use `noopener` on window.open here: with noopener, browsers may return `null` while still
  // opening an about:blank tab, so document.write never runs and the user sees an empty window.
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);
  const w = window.open(blobUrl, "_blank", "popup,width=820,height=640");
  if (!w) {
    URL.revokeObjectURL(blobUrl);
    return;
  }
  const revokeBlob = () => {
    try {
      URL.revokeObjectURL(blobUrl);
    } catch {
      /* ignore */
    }
  };
  w.addEventListener(
    "load",
    () => {
      const afterPrint = () => window.setTimeout(revokeBlob, 1_000);
      w.addEventListener("afterprint", afterPrint, { once: true });
      window.setTimeout(() => {
        try {
          w.focus();
          w.print();
        } catch {
          /* user may print manually from the certificate tab */
        }
      }, 150);
    },
    { once: true }
  );
  // If afterprint never fires, still release the blob URL eventually
  window.setTimeout(revokeBlob, 120_000);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
