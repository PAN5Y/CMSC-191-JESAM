import type { Manuscript } from "@/modules/publication-impact/types";

/**
 * Generate a deterministic DOI string for a JESAM manuscript.
 * Format: 10.47125/jesam.{year}.{volume}.{issue}.{seq}
 */
export function generateDOIString(manuscript: Manuscript): string {
  const year = new Date().getFullYear();
  // Extract a short hash from the UUID for uniqueness
  const seq = manuscript.id.split("-")[0].slice(0, 4);
  return `10.47125/jesam.${year}.27.1.${seq}`;
}

/**
 * Build Crossref-compliant deposit XML for a journal article.
 * Schema: https://www.crossref.org/schemas/
 */
export function generateCrossrefXML(manuscript: Manuscript, doi: string): string {
  const timestamp = Date.now().toString();
  const authorsXml = manuscript.authors
    .map((author, i) => {
      const parts = author.split(",").map((s) => s.trim());
      const surname = parts[0] || author;
      const givenName = parts[1] || "";
      return `
        <person_name sequence="${i === 0 ? "first" : "additional"}" contributor_role="author">
          ${givenName ? `<given_name>${escapeXml(givenName)}</given_name>` : ""}
          <surname>${escapeXml(surname)}</surname>
        </person_name>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<doi_batch xmlns="http://www.crossref.org/schema/5.3.1"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           version="5.3.1"
           xsi:schemaLocation="http://www.crossref.org/schema/5.3.1 https://www.crossref.org/schemas/crossref5.3.1.xsd">
  <head>
    <doi_batch_id>jesam-${timestamp}</doi_batch_id>
    <timestamp>${timestamp}</timestamp>
    <depositor>
      <depositor_name>JESAM Editorial System</depositor_name>
      <email_address>jesam@uplb.edu.ph</email_address>
    </depositor>
    <registrant>University of the Philippines Los Baños</registrant>
  </head>
  <body>
    <journal>
      <journal_metadata language="en">
        <full_title>Journal of Environmental Science and Management</full_title>
        <abbrev_title>JESAM</abbrev_title>
        <issn media_type="electronic">0119-1144</issn>
      </journal_metadata>
      <journal_article publication_type="full_text">
        <titles>
          <title>${escapeXml(manuscript.title)}</title>
        </titles>
        <contributors>${authorsXml}
        </contributors>
        <abstract xmlns:jats="http://www.ncbi.nlm.nih.gov/JATS1">
          <jats:p>${escapeXml(manuscript.abstract)}</jats:p>
        </abstract>
        <publication_date media_type="online">
          <year>${new Date().getFullYear()}</year>
          <month>${String(new Date().getMonth() + 1).padStart(2, "0")}</month>
          <day>${String(new Date().getDate()).padStart(2, "0")}</day>
        </publication_date>
        <doi_data>
          <doi>${escapeXml(doi)}</doi>
          <resource>https://jesam.uplb.edu.ph/article/${manuscript.id}</resource>
        </doi_data>
      </journal_article>
    </journal>
  </body>
</doi_batch>`;
}

/**
 * Attempt to deposit DOI metadata with Crossref.
 * Requires VITE_CROSSREF_LOGIN_ID and VITE_CROSSREF_LOGIN_PASSWD env vars.
 * Returns the DOI string on success, or throws on failure.
 */
export async function depositDOI(
  manuscript: Manuscript
): Promise<{ success: boolean; doi: string; error?: string }> {
  const loginId = import.meta.env.VITE_CROSSREF_LOGIN_ID as string;
  const loginPasswd = import.meta.env.VITE_CROSSREF_LOGIN_PASSWD as string;

  const doi = generateDOIString(manuscript);

  // If no credentials, return failure so UI can show manual fallback
  if (!loginId || !loginPasswd) {
    return {
      success: false,
      doi,
      error: "Crossref credentials not configured. Please register DOI manually.",
    };
  }

  const xml = generateCrossrefXML(manuscript, doi);
  const blob = new Blob([xml], { type: "application/xml" });

  const formData = new FormData();
  formData.append("operation", "doMDUpload");
  formData.append("login_id", loginId);
  formData.append("login_passwd", loginPasswd);
  formData.append("fname", blob, `jesam-${manuscript.id}.xml`);

  try {
    const response = await fetch(
      "https://doi.crossref.org/servlet/deposit",
      { method: "POST", body: formData }
    );

    if (response.ok) {
      return { success: true, doi };
    } else {
      const text = await response.text();
      return {
        success: false,
        doi,
        error: `Crossref returned ${response.status}: ${text.slice(0, 200)}`,
      };
    }
  } catch (err) {
    return {
      success: false,
      doi,
      error: `Network error: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
