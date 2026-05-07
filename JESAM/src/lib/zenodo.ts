import type { Manuscript } from "@/types";

const ZENODO_URL = import.meta.env.VITE_ZENODO_USE_SANDBOX === "true"
  ? "https://sandbox.zenodo.org/api"
  : "https://zenodo.org/api";

const ZENODO_TOKEN = import.meta.env.VITE_ZENODO_TOKEN;

/**
 * Register a manuscript with Zenodo to get a free DOI.
 */
export async function depositToZenodo(
  manuscript: Manuscript
): Promise<{ success: boolean; doi: string; error?: string }> {
  if (!ZENODO_TOKEN) {
    return {
      success: false,
      doi: "",
      error: "Zenodo token not configured. Please add VITE_ZENODO_TOKEN to .env.local",
    };
  }

  try {
    // 1. Create a new deposition
    const createResponse = await fetch(`${ZENODO_URL}/deposit/depositions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ZENODO_TOKEN}`,
      },
      body: JSON.stringify({}),
    });

    if (!createResponse.ok) {
      const errData = await createResponse.json();
      throw new Error(`Zenodo creation failed: ${errData.message || createResponse.statusText}`);
    }

    const deposition = await createResponse.json();
    const depositionId = deposition.id;

    // 2. Update metadata
    const metadataResponse = await fetch(`${ZENODO_URL}/deposit/depositions/${depositionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ZENODO_TOKEN}`,
      },
      body: JSON.stringify({
        metadata: {
          title: manuscript.title,
          upload_type: "publication",
          publication_type: "article",
          description: manuscript.abstract,
          creators: manuscript.authors.map(author => {
            const parts = author.split(",").map(s => s.trim());
            return { name: parts[0], affiliation: "University of the Philippines Los Baños" };
          }),
          journal_title: "Journal of Environmental Science and Management (JESAM)",
          keywords: manuscript.keywords,
        }
      }),
    });

    if (!metadataResponse.ok) {
      const errData = await metadataResponse.json();
      throw new Error(`Zenodo metadata update failed: ${errData.message || metadataResponse.statusText}`);
    }

    const updatedDeposition = await metadataResponse.json();
    
    // Note: In a real production scenario, you would also upload the PDF file here.
    // Zenodo requires at least one file to "Publish" and get a permanent DOI.
    // For this integration, we will return the "Reserved DOI" which Zenodo provides 
    // even before publication.

    const reservedDoi = updatedDeposition.metadata.prereserve_doi.doi;

    return {
      success: true,
      doi: reservedDoi,
    };
  } catch (err) {
    return {
      success: false,
      doi: "",
      error: err instanceof Error ? err.message : "Unknown Zenodo error",
    };
  }
}
