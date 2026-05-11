import { jsPDF } from "jspdf";
import type { Manuscript } from "@/types";

export interface SubmissionAcknowledgementPdf {
  blob: Blob;
  url: string;
  filename: string;
  base64: string;
}

function firstNameFrom(value: string | undefined) {
  const cleaned = value?.trim().replace(/\s+/g, " ");
  if (!cleaned) return "Author";
  return cleaned.split(" ")[0] || "Author";
}

export function acknowledgementAuthorFirstName(manuscript: Manuscript) {
  const details = manuscript.submission_metadata?.author_details ?? [];
  const corresponding = details.find((author) => author.isCorresponding) ?? details[0];
  return firstNameFrom(corresponding?.name ?? manuscript.authors[0]);
}

function referenceLabel(manuscript: Manuscript) {
  return manuscript.reference_code ?? manuscript.id.slice(0, 8).toUpperCase();
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read PDF blob."));
    reader.readAsDataURL(blob);
  });
}

function drawWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

export async function generateSubmissionAcknowledgementPdf(
  manuscript: Manuscript
): Promise<SubmissionAcknowledgementPdf> {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const marginX = 72;
  const maxWidth = 468;
  const lineHeight = 15;
  let y = 92;
  const authorFirstName = acknowledgementAuthorFirstName(manuscript);

  doc.setProperties({
    title: `Acknowledgement of Submission - ${referenceLabel(manuscript)}`,
    subject: "JESAM acknowledgement of manuscript submission",
    author: "Journal of Environmental Science and Management",
  });

  doc.setFont("times", "normal");
  doc.setFontSize(12);

  y = drawWrappedText(doc, `Dear ${authorFirstName},`, marginX, y, maxWidth, lineHeight);
  y += 18;
  y = drawWrappedText(doc, "Warm greetings!", marginX, y, maxWidth, lineHeight);
  y += 18;
  y = drawWrappedText(doc, "Thank you for your interest in publishing with us.", marginX, y, maxWidth, lineHeight);
  y += 18;
  y = drawWrappedText(
    doc,
    `Your manuscript, "${manuscript.title}," has been successfully submitted and will undergo the journal's initial screening process.`,
    marginX,
    y,
    maxWidth,
    lineHeight
  );
  y += 18;
  y = drawWrappedText(
    doc,
    "JESAM covers research articles on environmental planning and management, protected area development, planning and management, community-based resource management, environmental chemistry and toxicology, environmental restoration, social theory and the environment, and environmental security and management.",
    marginX,
    y,
    maxWidth,
    lineHeight
  );
  y += 18;
  y = drawWrappedText(doc, "JESAM is indexed in:", marginX, y, maxWidth, lineHeight);
  y += 8;

  const indexedIn = [
    "Web of Science Thomson Reuters Journal",
    "Science Citation Index Expanded (SciSearch®)",
    "Journal Citation Reports/Science Edition",
    "Current Contents®/Agriculture, Biology, and Environmental Sciences",
    "Sciverse-Scopus",
  ];
  for (const item of indexedIn) {
    y = drawWrappedText(doc, `•  ${item}`, marginX + 18, y, maxWidth - 18, lineHeight);
  }

  y += 18;
  y = drawWrappedText(
    doc,
    "We publish semi-annually, with issues released every June and December. The review process usually takes about a year. If an article is published, we charge a printing support fee of PhP 500.00 per page based on the final layout. For direct communication, send an email to us: jesam.uplb@up.edu.ph",
    marginX,
    y,
    maxWidth,
    lineHeight
  );
  y += 18;
  y = drawWrappedText(doc, "Thank you very much!", marginX, y, maxWidth, lineHeight);
  y += 26;
  y = drawWrappedText(doc, "Sincerely,", marginX, y, maxWidth, lineHeight);
  y += 28;

  doc.setFont("times", "bold");
  y = drawWrappedText(doc, "Your Editorial Office", marginX, y, maxWidth, lineHeight);
  doc.setFont("times", "normal");
  y = drawWrappedText(doc, "Journal of Environmental Science and Management", marginX, y, maxWidth, lineHeight);
  y = drawWrappedText(doc, "School of Environmental Science and Management", marginX, y, maxWidth, lineHeight);
  y = drawWrappedText(doc, "University of the Philippines Los Baños", marginX, y, maxWidth, lineHeight);
  drawWrappedText(doc, "College, Laguna, Philippines", marginX, y, maxWidth, lineHeight);

  const blob = doc.output("blob");
  const base64 = await blobToBase64(blob);
  const safeRef = referenceLabel(manuscript).replace(/[^a-zA-Z0-9._-]/g, "_");

  return {
    blob,
    url: URL.createObjectURL(blob),
    filename: `${safeRef}-submission-acknowledgement.pdf`,
    base64,
  };
}
