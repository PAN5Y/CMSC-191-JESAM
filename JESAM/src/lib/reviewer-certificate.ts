import { jsPDF } from "jspdf";
import type { User } from "@supabase/supabase-js";

export interface ReviewerCertificateInput {
  reviewerName: string;
  reviewerEmail: string;
  manuscriptReference: string;
  manuscriptTitle: string;
  completedAtIso: string;
  affiliation?: string;
}

export interface ReviewerCertificatePdf {
  blob: Blob;
  url: string;
  filename: string;
  base64: string;
}

export function reviewerDisplayNameFromUser(user: User | null): string {
  const m = user?.user_metadata as Record<string, string | undefined> | undefined;
  if (!m) return user?.email?.trim() || "Reviewer";
  const parts = [m.first_name, m.middle_name, m.last_name, m.suffix].filter(Boolean);
  const s = parts.join(" ").trim();
  return s || user?.email?.trim() || "Reviewer";
}

export function reviewerAffiliationFromUser(user: User | null): string {
  const m = user?.user_metadata as Record<string, string | undefined> | undefined;
  return m?.affiliation?.trim() || "the reviewer directory";
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read certificate PDF."));
    reader.readAsDataURL(blob);
  });
}

async function loadHeaderDataUrl() {
  const response = await fetch("/header.png");
  if (!response.ok) throw new Error(`Could not load certificate header (${response.status}).`);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read header image."));
    reader.readAsDataURL(blob);
  });
}

function drawWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  options?: { align?: "left" | "center" | "right" | "justify" }
) {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  doc.text(lines, x, y, options);
  return y + lines.length * lineHeight;
}

function drawBodyParagraph(doc: jsPDF, text: string, x: number, y: number, maxWidth: number) {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  doc.text(lines, x, y, { align: "left" });
  return y + lines.length * 17;
}

export async function generateReviewerCertificatePdf(
  input: ReviewerCertificateInput
): Promise<ReviewerCertificatePdf> {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const header = await loadHeaderDataUrl();
  const date = new Date(input.completedAtIso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const filenameRef = input.manuscriptReference.replace(/[^a-zA-Z0-9._-]/g, "_");
  const affiliation = input.affiliation?.trim() || "the reviewer directory";
  const contentLeft = 86;
  const contentWidth = pageWidth - contentLeft * 2;

  doc.setProperties({
    title: `JESAM Peer Reviewer Certification - ${input.manuscriptReference}`,
    subject: "JESAM peer reviewer certification",
    author: "Journal of Environmental Science and Management",
  });

  doc.addImage(header, "PNG", 54, 36, pageWidth - 108, 96);
  doc.setDrawColor(61, 74, 107);
  doc.setLineWidth(1.2);
  doc.line(72, 146, pageWidth - 72, 146);

  doc.setFont("times", "normal");
  doc.setFontSize(12);
  doc.text(date, contentLeft, 190);

  doc.setFont("times", "bold");
  doc.setFontSize(17);
  doc.text("C E R T I F I C A T I O N", pageWidth / 2, 260, { align: "center" });

  doc.setFont("times", "normal");
  doc.setFontSize(12);
  const body =
    `This certifies that ${input.reviewerName}, Peer Reviewer at ${affiliation}, has served as a Peer Reviewer on ${date} for the paper, "${input.manuscriptTitle}", which was submitted for consideration in the Journal of Environmental Science and Management (JESAM).`;
  drawBodyParagraph(doc, body, contentLeft, 326, contentWidth);

  doc.setFont("times", "bold");
  doc.text("THADDEUS P. LAWAS", contentLeft, 544);
  doc.setFont("times", "normal");
  doc.text("Managing Editor, JESAM", contentLeft, 562);

  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`Reference: ${input.manuscriptReference}`, contentLeft, 704);
  doc.text(`Reviewer email: ${input.reviewerEmail}`, contentLeft, 718);
  doc.setTextColor(0, 0, 0);

  const blob = doc.output("blob");
  const base64 = await blobToBase64(blob);
  return {
    blob,
    url: URL.createObjectURL(blob),
    filename: `${filenameRef}-peer-reviewer-certification.pdf`,
    base64,
  };
}
