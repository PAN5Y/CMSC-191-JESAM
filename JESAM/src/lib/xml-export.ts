import type { Manuscript } from "@/modules/publication-impact/types";

/**
 * Generate a downloadable XML file with manuscript metadata
 * for indexing services (Crossref, DOAJ, Scopus).
 */
export function generateMetadataXML(manuscript: Manuscript): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const authorsXml = manuscript.authors
    .map((a) => `    <author>${esc(a)}</author>`)
    .join("\n");

  const keywordsXml = manuscript.keywords
    .map((k) => `    <keyword>${esc(k)}</keyword>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<article xmlns="http://jesam.uplb.edu.ph/schema/export/1.0">
  <metadata>
    <title>${esc(manuscript.title)}</title>
    <doi>${esc(manuscript.doi || "pending")}</doi>
    <journal>Journal of Environmental Science and Management</journal>
    <issn>0119-1144</issn>
    <publisher>University of the Philippines Los Baños</publisher>
    <publication-date>${manuscript.published_at || new Date().toISOString()}</publication-date>
    <issue-assignment>${esc(manuscript.issue_assignment || "Online-First")}</issue-assignment>
    <classification>${esc(manuscript.classification)}</classification>
  </metadata>
  <authors>
${authorsXml}
  </authors>
  <abstract>${esc(manuscript.abstract)}</abstract>
  <keywords>
${keywordsXml}
  </keywords>
</article>`;
}

/**
 * Trigger a browser download of the XML metadata file.
 */
export function downloadMetadataXML(manuscript: Manuscript): void {
  const xml = generateMetadataXML(manuscript);
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `jesam-${manuscript.id}-metadata.xml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
