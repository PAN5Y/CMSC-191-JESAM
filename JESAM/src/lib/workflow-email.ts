import { supabase } from "@/lib/supabase";
import type { Manuscript } from "@/types";

type WorkflowEmailResponse = {
  ok?: boolean;
  error?: string;
  details?: unknown;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function paragraph(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function describeDetails(details: unknown) {
  if (!details || typeof details !== "object") return "";
  const maybeError = details as {
    error?: {
      message?: string;
      status?: string;
      details?: unknown;
    };
    error_description?: string;
  };
  return (
    maybeError.error?.message ??
    maybeError.error?.status ??
    maybeError.error_description ??
    ""
  );
}

async function parseFunctionError(error: unknown) {
  const fallback = error instanceof Error ? error.message : "Email function request failed.";
  const context = (error as { context?: unknown } | null)?.context;
  if (!(context instanceof Response)) return fallback;

  try {
    const body = (await context.clone().json()) as WorkflowEmailResponse;
    const detail = describeDetails(body.details);
    return [body.error, detail].filter(Boolean).join(" ");
  } catch {
    return fallback;
  }
}

function getSupabaseFunctionUrl(functionName: string) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!supabaseUrl) throw new Error("Missing VITE_SUPABASE_URL.");
  return `${supabaseUrl.replace(/\/$/, "")}/functions/v1/${functionName}`;
}

function getSupabaseAnonKey() {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!anonKey) throw new Error("Missing VITE_SUPABASE_ANON_KEY.");
  return anonKey;
}

async function sendWorkflowEmail(payload: {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    contentType: string;
    contentBase64: string;
  }>;
}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return {
      data: null,
      error: new Error("No active Supabase session found for sending workflow email."),
    };
  }

  let response: Response;
  try {
    response = await fetch(getSupabaseFunctionUrl("send-workflow-email"), {
      method: "POST",
      headers: {
        apikey: getSupabaseAnonKey(),
        Authorization: `Bearer ${getSupabaseAnonKey()}`,
        "Content-Type": "application/json",
        "x-supabase-user-token": session.access_token,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    return {
      data: null,
      error: new Error(error instanceof Error ? error.message : "Email function request failed."),
    };
  }

  const data = (await response.json().catch(() => ({}))) as WorkflowEmailResponse;

  if (!response.ok) {
    return {
      data,
      error: new Error(
        [data.error || `Email function failed with status ${response.status}`, describeDetails(data.details)]
          .filter(Boolean)
          .join(" ")
      ),
    };
  }

  if (data?.error) {
    const detail = describeDetails(data.details);
    return {
      data,
      error: new Error([data.error, detail].filter(Boolean).join(" ")),
    };
  }

  return { data, error: null };
}

export async function sendScreeningRejectionEmail(input: {
  manuscript: Manuscript;
  to: string;
  reason?: string;
  comments?: string;
  decidedBy?: string;
}) {
  const reference = input.manuscript.reference_code ?? input.manuscript.id.slice(0, 8).toUpperCase();
  const reason = input.reason?.trim() || "Rejected during initial editorial screening.";
  const comments = input.comments?.trim();
  const subject = `JESAM manuscript decision: ${reference}`;
  const text = [
    "Dear Author,",
    "",
    `Your manuscript "${input.manuscript.title}" (${reference}) was rejected during initial editorial screening.`,
    "",
    `Reason: ${reason}`,
    comments ? `Editorial comments: ${comments}` : undefined,
    "",
    "Thank you for considering JESAM for your work.",
    "",
    "JESAM Editorial Office",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <p>Dear Author,</p>
      <p>
        Your manuscript <strong>${escapeHtml(input.manuscript.title)}</strong>
        (${escapeHtml(reference)}) was rejected during initial editorial screening.
      </p>
      <p><strong>Reason:</strong> ${paragraph(reason)}</p>
      ${
        comments
          ? `<p><strong>Editorial comments:</strong><br />${paragraph(comments)}</p>`
          : ""
      }
      <p>Thank you for considering JESAM for your work.</p>
      <p>JESAM Editorial Office</p>
    </div>
  `;

  return sendWorkflowEmail({
    to: input.to,
    subject,
    text,
    html,
    replyTo: input.decidedBy?.includes("@") ? input.decidedBy : undefined,
  });
}

export async function sendProductionRejectionEmail(input: {
  manuscript: Manuscript;
  to: string;
  comments?: string;
  checkSummary?: string;
  decidedBy?: string;
}) {
  const reference = input.manuscript.reference_code ?? input.manuscript.id.slice(0, 8).toUpperCase();
  const comments = input.comments?.trim();
  const checkSummary = input.checkSummary?.trim();
  const subject = `JESAM production decision: ${reference}`;
  const text = [
    "Dear Author,",
    "",
    `Your manuscript "${input.manuscript.title}" (${reference}) was rejected after production pre-review checks.`,
    "",
    comments ? `Production Editor comments: ${comments}` : "Production Editor comments: No additional comments were provided.",
    checkSummary ? `Check results:\n${checkSummary}` : undefined,
    "",
    "Thank you for considering JESAM for your work.",
    "",
    "JESAM Editorial Office",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <p>Dear Author,</p>
      <p>
        Your manuscript <strong>${escapeHtml(input.manuscript.title)}</strong>
        (${escapeHtml(reference)}) was rejected after production pre-review checks.
      </p>
      <p>
        <strong>Production Editor comments:</strong><br />
        ${paragraph(comments || "No additional comments were provided.")}
      </p>
      ${
        checkSummary
          ? `<p><strong>Check results:</strong><br />${paragraph(checkSummary)}</p>`
          : ""
      }
      <p>Thank you for considering JESAM for your work.</p>
      <p>JESAM Editorial Office</p>
    </div>
  `;

  return sendWorkflowEmail({
    to: input.to,
    subject,
    text,
    html,
    replyTo: input.decidedBy?.includes("@") ? input.decidedBy : undefined,
  });
}

export async function sendSubmissionAcknowledgementEmail(input: {
  manuscript: Manuscript;
  to: string;
  authorFirstName: string;
  pdfFilename: string;
  pdfBase64: string;
}) {
  const reference = input.manuscript.reference_code ?? input.manuscript.id.slice(0, 8).toUpperCase();
  const subject = `JESAM acknowledgement of submission: ${reference}`;
  const text = [
    `Dear ${input.authorFirstName},`,
    "",
    `Thank you for submitting your manuscript "${input.manuscript.title}" to JESAM.`,
    "",
    "Attached is your acknowledgement of submission.",
    "",
    "JESAM Editorial Office",
  ].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <p>Dear ${escapeHtml(input.authorFirstName)},</p>
      <p>
        Thank you for submitting your manuscript
        <strong>${escapeHtml(input.manuscript.title)}</strong> to JESAM.
      </p>
      <p>Attached is your acknowledgement of submission.</p>
      <p>JESAM Editorial Office</p>
    </div>
  `;

  return sendWorkflowEmail({
    to: input.to,
    subject,
    text,
    html,
    attachments: [
      {
        filename: input.pdfFilename,
        contentType: "application/pdf",
        contentBase64: input.pdfBase64,
      },
    ],
  });
}

export async function sendReviewerCertificateEmail(input: {
  to: string;
  reviewerName: string;
  manuscriptReference: string;
  manuscriptTitle: string;
  pdfFilename: string;
  pdfBase64: string;
}) {
  const subject = `JESAM peer reviewer certificate: ${input.manuscriptReference}`;
  const text = [
    `Dear ${input.reviewerName},`,
    "",
    `Thank you for completing your peer review for manuscript ${input.manuscriptReference}, "${input.manuscriptTitle}".`,
    "",
    "Attached is your JESAM peer reviewer certificate.",
    "",
    "JESAM Editorial Office",
  ].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <p>Dear ${escapeHtml(input.reviewerName)},</p>
      <p>
        Thank you for completing your peer review for manuscript
        <strong>${escapeHtml(input.manuscriptReference)}</strong>,
        <strong>${escapeHtml(input.manuscriptTitle)}</strong>.
      </p>
      <p>Attached is your JESAM peer reviewer certificate.</p>
      <p>JESAM Editorial Office</p>
    </div>
  `;

  return sendWorkflowEmail({
    to: input.to,
    subject,
    text,
    html,
    attachments: [
      {
        filename: input.pdfFilename,
        contentType: "application/pdf",
        contentBase64: input.pdfBase64,
      },
    ],
  });
}
