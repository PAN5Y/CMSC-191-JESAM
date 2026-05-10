import { createClient } from "@supabase/supabase-js";
import { inflate } from "pako";

type Issue = {
  code: string;
  severity: "error" | "warning";
  message: string;
};

const SECTION_SPECS = [
  { name: "Abstract", aliases: ["abstract"] },
  { name: "Introduction", aliases: ["introduction"] },
  {
    name: "Materials and Methods",
    aliases: ["materials and methods", "materials & methods", "methodology", "methods"],
  },
  {
    name: "Results and Discussion",
    aliases: ["results and discussion", "results & discussion", "results"],
  },
  {
    name: "Conclusion and Recommendations",
    aliases: [
      "conclusion and recommendations",
      "conclusions and recommendations",
      "conclusion",
      "conclusions",
    ],
  },
  { name: "References", aliases: ["references", "literature cited"] },
  {
    name: "Acknowledgment",
    aliases: ["acknowledgment", "acknowledgement", "acknowledgments", "acknowledgements"],
  },
];

const DEFAULT_BUCKET = "manuscript-files";
const DEFAULT_TEMPLATE_PATH = "templates/jesam-manuscript-template.pdf";
const LOREM_RE = /\b(lorem|ipsum|dolor|sit amet|consectetur|adipiscing|elit|sed do|eiusmod|incididunt|labore|magna aliqua)\b/i;

class TemplateCheckError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "TemplateCheckError";
    this.status = status;
  }
}

function jsonResponse(body: unknown, status: number, headers: Headers) {
  return new Response(JSON.stringify(body), { status, headers });
}

async function downloadObject(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  path: string
) {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) {
    throw new TemplateCheckError(
      `Could not download ${bucket}/${path}: ${error?.message ?? "not found"}`,
      404
    );
  }
  return new Uint8Array(await data.arrayBuffer());
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function normalizeHeading(value: string) {
  return value
    .replace(/^\d+(\.\d+)*\s*/, "")
    .replace(/[:.]+$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeComparableText(value: string) {
  return value
    .toLowerCase()
    .replace(/[()[\]{}.,:;'"“”‘’]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function headingMatchesAlias(heading: string, alias: string) {
  const normalizedHeading = normalizeHeading(heading);
  const normalizedAlias = normalizeHeading(alias);
  return normalizedHeading === normalizedAlias || normalizedHeading.startsWith(`${normalizedAlias} `);
}

function decodePdfName(value: string) {
  return value.replace(/#([0-9a-f]{2})/gi, (_, hex: string) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

function isLikelyTimesFont(value: string) {
  const decoded = decodePdfName(value).toLowerCase().replace(/[-_]/g, " ");
  return decoded.includes("times") || decoded.includes("timesnewroman");
}

function isLikelyTimesPdfJsFont(value: string) {
  const decoded = value.toLowerCase().replace(/[-_+]/g, " ");
  return decoded.includes("times") || decoded.includes("tnr") || decoded.includes("roman");
}

function decodePdfLiteral(raw: string) {
  let output = "";
  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (char !== "\\") {
      output += char;
      continue;
    }

    const next = raw[++i];
    if (next === "n") output += "\n";
    else if (next === "r") output += "\r";
    else if (next === "t") output += "\t";
    else if (next === "b") output += "\b";
    else if (next === "f") output += "\f";
    else if (next === "\\" || next === "(" || next === ")") output += next;
    else if (/[0-7]/.test(next ?? "")) {
      let octal = next;
      for (let j = 0; j < 2 && /[0-7]/.test(raw[i + 1] ?? ""); j++) {
        octal += raw[++i];
      }
      output += String.fromCharCode(parseInt(octal, 8));
    } else if (next) {
      output += next;
    }
  }
  return output;
}

function decodeUtf16Be(bytes: number[]) {
  let output = "";
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    const code = (bytes[i] << 8) | bytes[i + 1];
    if (code) output += String.fromCharCode(code);
  }
  return output;
}

function printableRatio(value: string) {
  if (!value) return 0;
  const printable = [...value].filter((char) => /[\p{L}\p{N}\p{P}\p{Zs}\s]/u.test(char)).length;
  return printable / value.length;
}

function decodePdfHex(raw: string, cmap?: Map<string, string>) {
  const clean = raw.replace(/[^0-9a-f]/gi, "");
  if (cmap) {
    let mapped = "";
    for (let i = 0; i < clean.length; i += 4) {
      const code = clean.slice(i, i + 4).toUpperCase();
      mapped += cmap.get(code) ?? "";
    }
    if (mapped.trim()) return mapped;

    for (let i = 0; i < clean.length; i += 2) {
      const code = clean.slice(i, i + 2).toUpperCase();
      mapped += cmap.get(code) ?? "";
    }
    if (mapped.trim()) return mapped;
  }

  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    bytes.push(parseInt(clean.slice(i, i + 2).padEnd(2, "0"), 16));
  }
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return decodeUtf16Be(bytes.slice(2));
  }

  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(bytes));
  const utf16 = decodeUtf16Be(bytes);
  const latin = String.fromCharCode(...bytes);
  const candidates = [utf8, utf16, latin].sort((a, b) => printableRatio(b) - printableRatio(a));
  return candidates[0] ?? "";
}

function extractStreams(bytes: Uint8Array) {
  const latin = new TextDecoder("latin1").decode(bytes);
  const streams: string[] = [];
  const streamRe = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRe.exec(latin))) {
    const dictStart = Math.max(0, match.index - 800);
    const dict = latin.slice(dictStart, match.index);
    const raw = match[1] ?? "";
    const rawBytes = Uint8Array.from(raw, (char) => char.charCodeAt(0) & 0xff);

    if (/\/FlateDecode\b/.test(dict)) {
      try {
        streams.push(new TextDecoder("utf-8", { fatal: false }).decode(inflate(rawBytes)));
      } catch {
        streams.push(raw);
      }
    } else {
      streams.push(raw);
    }
  }

  return { latin, streams };
}

function decodeUnicodeHex(raw: string) {
  return decodePdfHex(raw).replace(/\0/g, "").trim();
}

function buildToUnicodeMap(content: string) {
  const cmap = new Map<string, string>();

  for (const block of content.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const pair of (block[1] ?? "").matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g)) {
      cmap.set(pair[1].toUpperCase(), decodeUnicodeHex(pair[2]));
    }
  }

  for (const block of content.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const range of (block[1] ?? "").matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g)) {
      const start = parseInt(range[1], 16);
      const end = parseInt(range[2], 16);
      const dest = parseInt(range[3], 16);
      const width = range[1].length;
      for (let code = start; code <= end && code - start < 256; code++) {
        const srcHex = code.toString(16).toUpperCase().padStart(width, "0");
        const dstHex = (dest + code - start).toString(16).toUpperCase().padStart(range[3].length, "0");
        cmap.set(srcHex, decodeUnicodeHex(dstHex));
      }
    }
  }

  return cmap;
}

function decodePdfTextToken(token: string, cmap: Map<string, string>) {
  const trimmed = token.trim();
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return decodePdfHex(trimmed.slice(1, -1), cmap);
  }
  if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
    return decodePdfLiteral(trimmed.slice(1, -1));
  }
  return "";
}

function collapseSeparatedLetters(value: string) {
  return value.replace(/\b(?:[A-Za-z]\s+){2,}[A-Za-z]\b/g, (match) => match.replace(/\s+/g, ""));
}

function lineLooksLikeSectionHeading(line: string, alias: string) {
  const normalizedLine = normalizeHeading(line);
  const normalizedAlias = normalizeHeading(alias);
  if (!normalizedLine || !normalizedAlias) return false;

  const lineWords = normalizedLine.split(/\s+/).filter(Boolean).length;
  const aliasWords = normalizedAlias.split(/\s+/).filter(Boolean).length;
  const exact = normalizedLine === normalizedAlias;
  const numberedExact = normalizedLine.replace(/^\d+(\.\d+)*\s+/, "") === normalizedAlias;
  const startsWithAlias =
    normalizedLine.startsWith(`${normalizedAlias} `) ||
    normalizedLine.startsWith(`${normalizedAlias}:`);

  return exact || numberedExact || (startsWithAlias && lineWords <= aliasWords + 4);
}

function buildRequiredSections(textRuns: string[], normalizedBodyText: string) {
  const collapsedBodyText = normalizedBodyText.replace(/\s+/g, "");

  return SECTION_SPECS.map((section) => {
    const headingIndexes = textRuns
      .map((line, index) =>
        section.aliases.some((alias) => lineLooksLikeSectionHeading(line, alias)) ? index : null
      )
      .filter((index): index is number => index !== null);

    if (headingIndexes.length > 0) {
      return {
        name: section.name,
        found: true,
        order: Math.min(...headingIndexes),
      };
    }

    const candidates = section.aliases
      .filter((alias) => normalizeComparableText(alias).replace(/\s+/g, "").length >= 9)
      .map((alias) => {
        const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const index = normalizedBodyText.search(new RegExp(`\\b${escapedAlias}\\b`, "i"));
        if (index >= 0) return index + textRuns.length + 1;
        const compactAlias = normalizeComparableText(alias).replace(/\s+/g, "");
        const compactIndex = collapsedBodyText.indexOf(compactAlias);
        return compactIndex >= 0 ? compactIndex + textRuns.length + 1 : null;
      })
      .filter((index): index is number => index !== null);

    return {
      name: section.name,
      found: candidates.length > 0,
      order: candidates.length > 0 ? Math.min(...candidates) : null,
    };
  });
}

function extractPdfFeatures(bytes: Uint8Array) {
  const { latin, streams } = extractStreams(bytes);
  const content = streams.join("\n");
  const cmap = buildToUnicodeMap(content);
  const fontNames = [...latin.matchAll(/\/(?:BaseFont|FontName)\s*\/([A-Za-z0-9#+._-]+)/g)]
    .map((match) => match[1])
    .filter(Boolean);
  const fontSizeSamples = [...content.matchAll(/\/[A-Za-z0-9._+-]+\s+(\d+(?:\.\d+)?)\s+Tf\b/g)]
    .map((match) => Number(match[1]))
    .filter((size) => Number.isFinite(size));
  const directTexts = [...content.matchAll(/(<[0-9a-fA-F\s]+>|\((?:\\.|[^\\()])*\))\s*(?:Tj|'|")\b/g)].map(
    (match) => decodePdfTextToken(match[1], cmap)
  );
  const arrayTexts = [...content.matchAll(/\[([\s\S]*?)\]\s*TJ\b/g)].map((match) => {
    const arrayBody = match[1] ?? "";
    const literals = [...arrayBody.matchAll(/\((?:\\.|[^\\()])*\)|<([0-9a-fA-F\s]+)>/g)].map(
      (part) => {
        const token = part[0];
        return decodePdfTextToken(token, cmap);
      }
    );
    return literals.join("");
  });
  const textRuns = [...directTexts, ...arrayTexts]
    .map((text) => collapseSeparatedLetters(text).replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const bodyText = textRuns.join(" ").replace(/\s+/g, " ").trim();
  const normalizedBodyText = normalizeComparableText(bodyText);
  const imageCount = (latin.match(/\/Subtype\s*\/Image\b/g) ?? []).length;
  const figureCaptions = textRuns.filter((text) => /^fig(ure)?\.?\s*\d+[\s.:]/i.test(text));
  const tableCaptions = textRuns.filter((text) => /^table\s*\d+[\s.:]/i.test(text));
  const requiredSections = buildRequiredSections(textRuns, normalizedBodyText);
  const headings = requiredSections.filter((section) => section.found).map((section) => section.name);
  const timesNewRomanRatio =
    fontNames.length > 0 ? fontNames.filter(isLikelyTimesFont).length / fontNames.length : 0;
  const size12Ratio =
    fontSizeSamples.length > 0
      ? fontSizeSamples.filter((size) => Math.abs(size - 12) < 0.25).length / fontSizeSamples.length
      : 0;

  return {
    bodyText,
    normalizedBodyText,
    headings,
    textRuns,
    figureCaptions,
    tableCaptions,
    imageCount,
    wordCount: countWords(bodyText),
    requiredSections,
    formatting: {
      directFontSamples: fontNames.length,
      directSizeSamples: fontSizeSamples.length,
      directLineSpacingSamples: 0,
      timesNewRomanRatio,
      size12Ratio,
      doubleSpacingRatio: 0,
    },
  };
}

type PdfFeatures = ReturnType<typeof extractPdfFeatures>;

function extractTextFeatures(text: string): PdfFeatures {
  const textRuns = text
    .split(/\r?\n+/)
    .map((line) => collapseSeparatedLetters(line).replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const bodyText = (textRuns.length > 0 ? textRuns.join(" ") : text).replace(/\s+/g, " ").trim();
  const normalizedBodyText = normalizeComparableText(bodyText);
  const figureCaptions = textRuns.filter((line) => /^fig(ure)?\.?\s*\d+[\s.:]/i.test(line));
  const tableCaptions = textRuns.filter((line) => /^table\s*\d+[\s.:]/i.test(line));
  const requiredSections = buildRequiredSections(textRuns, normalizedBodyText);

  return {
    bodyText,
    normalizedBodyText,
    headings: requiredSections.filter((section) => section.found).map((section) => section.name),
    textRuns,
    figureCaptions,
    tableCaptions,
    imageCount: 0,
    wordCount: countWords(bodyText),
    requiredSections,
    formatting: {
      directFontSamples: 0,
      directSizeSamples: 0,
      directLineSpacingSamples: 0,
      timesNewRomanRatio: 0,
      size12Ratio: 0,
      doubleSpacingRatio: 0,
    },
  };
}

async function extractPdfFeaturesWithPdfJs(bytes: Uint8Array): Promise<PdfFeatures | null> {
  try {
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const task = getDocument({
      data: bytes.slice(),
      disableFontFace: true,
      disableWorker: true,
      useSystemFonts: true,
    });
    const pdf = await task.promise;
    const textRuns: string[] = [];
    const fontNames: string[] = [];
    const fontSizeSamples: number[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent({
        disableNormalization: false,
        includeMarkedContent: false,
      });

      for (const item of textContent.items) {
        if (!("str" in item)) continue;
        const text = collapseSeparatedLetters(String(item.str ?? ""))
          .replace(/\s+/g, " ")
          .trim();
        if (text) textRuns.push(text);

        if ("fontName" in item && item.fontName) {
          fontNames.push(String(item.fontName));
        }

        const transform = "transform" in item && Array.isArray(item.transform)
          ? item.transform
          : [];
        const height = "height" in item && typeof item.height === "number"
          ? item.height
          : undefined;
        const transformSize = transform.length >= 4
          ? Math.sqrt(Number(transform[2]) ** 2 + Number(transform[3]) ** 2)
          : undefined;
        const size = height || transformSize;
        if (typeof size === "number" && Number.isFinite(size) && size > 0) {
          fontSizeSamples.push(size);
        }
      }
    }

    const bodyText = textRuns.join(" ").replace(/\s+/g, " ").trim();
    if (countWords(bodyText) < 20) return null;

    const normalizedBodyText = normalizeComparableText(bodyText);
    const figureCaptions = textRuns.filter((text) => /^fig(ure)?\.?\s*\d+[\s.:]/i.test(text));
    const tableCaptions = textRuns.filter((text) => /^table\s*\d+[\s.:]/i.test(text));
    const requiredSections = buildRequiredSections(textRuns, normalizedBodyText);
    const headings = requiredSections.filter((section) => section.found).map((section) => section.name);
    const timesNewRomanRatio =
      fontNames.length > 0
        ? fontNames.filter(isLikelyTimesPdfJsFont).length / fontNames.length
        : 0;
    const size12Ratio =
      fontSizeSamples.length > 0
        ? fontSizeSamples.filter((size) => Math.abs(size - 12) < 0.75).length / fontSizeSamples.length
        : 0;

    return {
      bodyText,
      normalizedBodyText,
      headings,
      textRuns,
      figureCaptions,
      tableCaptions,
      imageCount: 0,
      wordCount: countWords(bodyText),
      requiredSections,
      formatting: {
        directFontSamples: fontNames.length,
        directSizeSamples: fontSizeSamples.length,
        directLineSpacingSamples: 0,
        timesNewRomanRatio,
        size12Ratio,
        doubleSpacingRatio: 0,
      },
    };
  } catch (error) {
    console.error("PDF.js extraction failed; falling back to stream parser:", error);
    return null;
  }
}

function evaluatePdfTemplate(submission: PdfFeatures, template: PdfFeatures, templatePath: string) {
  const issues: Issue[] = [];

  for (const section of submission.requiredSections) {
    if (!section.found) {
      issues.push({
        code: "missing-section",
        severity: "error",
        message: `Missing required section: ${section.name}.`,
      });
    }
  }

  const foundSections = submission.requiredSections.filter((section) => section.found);
  for (let i = 1; i < foundSections.length; i++) {
    const prev = foundSections[i - 1];
    const current = foundSections[i];
    if ((prev.order ?? 0) > (current.order ?? 0)) {
      issues.push({
        code: "section-order",
        severity: "error",
        message: `${current.name} appears before ${prev.name}; follow the template section order.`,
      });
    }
  }

  if (submission.wordCount < 500) {
    issues.push({
      code: "document-too-short",
      severity: "error",
      message:
        submission.wordCount < 20
          ? "No readable PDF text layer was detected. This PDF may be scanned or image-only; OCR is required before template checking."
          : "PDF appears too short for a full manuscript template check.",
    });
  }

  if (
    submission.formatting.directFontSamples >= 3 &&
    submission.formatting.timesNewRomanRatio < 0.5
  ) {
    issues.push({
      code: "font-family-mismatch",
      severity: "warning",
      message:
        "Embedded PDF font names do not appear to be mostly Times New Roman. PDF font detection is approximate.",
    });
  }

  if (submission.formatting.directSizeSamples >= 20 && submission.formatting.size12Ratio < 0.5) {
    issues.push({
      code: "font-size-mismatch",
      severity: "warning",
      message:
        "Most detected PDF text samples do not appear to use 12 pt font size. PDF font-size detection is approximate.",
    });
  }

  const expectedTemplateSections = template.requiredSections.filter((section) => section.found);
  for (const section of expectedTemplateSections) {
    const inSubmission = submission.requiredSections.find((s) => s.name === section.name);
    if (!inSubmission?.found) {
      issues.push({
        code: "template-section-mismatch",
        severity: "error",
        message: `The base PDF template includes ${section.name}, but the manuscript does not.`,
      });
    }
  }

  if (LOREM_RE.test(submission.bodyText)) {
    issues.push({
      code: "placeholder-text",
      severity: "error",
      message: "Placeholder lorem ipsum/template text appears to remain in the PDF.",
    });
  }

  if (submission.imageCount > 0 && submission.figureCaptions.length === 0) {
    issues.push({
      code: "missing-figure-captions",
      severity: "warning",
      message: "PDF image objects were found but no Figure captions were detected.",
    });
  }

  const tableLikeText = /\btable\b/i.test(submission.bodyText);
  if (tableLikeText && submission.tableCaptions.length === 0) {
    issues.push({
      code: "missing-table-captions",
      severity: "warning",
      message: "Table-like content was found but no Table captions were detected.",
    });
  }

  if (submission.formatting.directLineSpacingSamples === 0) {
    issues.push({
      code: "pdf-layout-estimate",
      severity: "warning",
      message:
        "PDF template checks are layout estimates. For strict heading-style and line-spacing validation, submit the DOCX source.",
    });
  }

  const substantiveWordCount = countWords(
    submission.normalizedBodyText.replace(LOREM_RE, " ").replace(/\s+/g, " ")
  );
  if (substantiveWordCount < 350) {
    issues.push({
      code: "low-substantive-content",
      severity: "error",
      message:
        "The PDF appears to contain too little author-written content after excluding placeholder text.",
    });
  }

  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  const score = Math.max(0, 100 - errorCount * 18 - warningCount * 6);

  return {
    passed: errorCount === 0,
    score,
    checkedAt: new Date().toISOString(),
    templatePath,
    requiredSections: submission.requiredSections,
    headingSequence: submission.headings,
    figureCaptions: submission.figureCaptions,
    tableCaptions: submission.tableCaptions,
    imageCount: submission.imageCount,
    wordCount: submission.wordCount,
    substantiveWordCount,
    redTemplateHintsRemaining: [],
    templateInstructionsRemaining: [],
    formatting: submission.formatting,
    issues,
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "*";
  const defaultHeaders = new Headers({
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
  });

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: defaultHeaders });
  }

  try {
    const {
      manuscriptId,
      bucket = DEFAULT_BUCKET,
      storagePath,
      extractedText,
      templateBucket = DEFAULT_BUCKET,
      templatePath = Deno.env.get("JESAM_PDF_TEMPLATE_PATH") ?? DEFAULT_TEMPLATE_PATH,
    } = await req.json();

    if (!storagePath || typeof storagePath !== "string") {
      return jsonResponse({ error: "storagePath is required." }, 400, defaultHeaders);
    }
    if (!storagePath.toLowerCase().endsWith(".pdf")) {
      return jsonResponse({ error: "PDF template check requires a .pdf manuscript file." }, 400, defaultHeaders);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new TemplateCheckError("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const cleanExtractedText =
      typeof extractedText === "string"
        ? extractedText
            .split(/\r?\n/)
            .map((line) => line.replace(/[ \t]+/g, " ").trim())
            .join("\n")
            .trim()
        : "";
    const submissionBuffer = await downloadObject(supabase, bucket, storagePath);
    const submissionPdf =
      cleanExtractedText.length >= 20
        ? extractTextFeatures(cleanExtractedText)
        : (await extractPdfFeaturesWithPdfJs(submissionBuffer)) ?? extractPdfFeatures(submissionBuffer);

    let templatePdf: PdfFeatures = {
      ...submissionPdf,
      requiredSections: SECTION_SPECS.map((section) => ({
        name: section.name,
        found: true,
        order: SECTION_SPECS.indexOf(section),
      })),
    };
    try {
      const templateBuffer = await downloadObject(supabase, templateBucket, templatePath);
      templatePdf =
        (await extractPdfFeaturesWithPdfJs(templateBuffer)) ?? extractPdfFeatures(templateBuffer);
    } catch {
      templatePath;
    }

    const report = evaluatePdfTemplate(submissionPdf, templatePdf, templatePath);

    if (manuscriptId && typeof manuscriptId === "string") {
      const { data: current, error: fetchError } = await supabase
        .from("manuscripts")
        .select("submission_metadata")
        .eq("id", manuscriptId)
        .single();

      if (!fetchError) {
        const previousMetadata = current?.submission_metadata && typeof current.submission_metadata === "object"
          ? current.submission_metadata
          : {};
        await supabase
          .from("manuscripts")
          .update({
            submission_metadata: {
              ...previousMetadata,
              template_check_report: report,
            },
          })
          .eq("id", manuscriptId);
      }
    }

    return jsonResponse(
      {
        report,
        extractedText: submissionPdf.bodyText,
        warnings: [
          "PDF template checks estimate layout and structure from rendered PDF content. DOCX remains the strictest source for heading styles and line spacing.",
        ],
      },
      200,
      defaultHeaders
    );
  } catch (error) {
    console.error("PDF template check error:", error);
    const message = error instanceof Error ? error.message : "PDF template check failed.";
    const status = error instanceof TemplateCheckError ? error.status : 500;
    return jsonResponse({ error: message }, status, defaultHeaders);
  }
});
