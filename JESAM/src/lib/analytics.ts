import type { Manuscript } from "@/types";

const GA_MEASUREMENT_ID = "G-P14YRC0DZ4";

declare global {
  interface Window {
    gtag?: (
      command: "config" | "event" | "js",
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
  }
}

function canTrack() {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

export function trackPublicPageView(path: string, title: string) {
  if (!canTrack()) return;

  window.gtag!("event", "page_view", {
    page_title: title,
    page_location: window.location.href,
    page_path: path,
    audience: "public",
  });
}

export function trackPublicPaperView(manuscript: Manuscript) {
  if (!canTrack()) return;

  window.gtag!("event", "paper_view", {
    paper_id: manuscript.id,
    paper_reference: manuscript.reference_code ?? manuscript.id.slice(0, 8),
    paper_title: manuscript.title,
    paper_classification: manuscript.classification ?? "Unclassified",
    paper_doi: manuscript.doi ?? "none",
    page_location: window.location.href,
    page_path: window.location.pathname,
    audience: "public",
  });
}

export { GA_MEASUREMENT_ID };
