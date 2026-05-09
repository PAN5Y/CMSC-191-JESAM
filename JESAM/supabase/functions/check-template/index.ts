import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";

type Issue = {
  code: string;
  severity: "error" | "warning";
  message: string;
};

type SectionResult = {
  name: string;
  found: boolean;
  order: number | null;
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
  { name: "Acknowledgment", aliases: ["acknowledgment", "acknowledgement", "acknowledgments", "acknowledgements"] },
];
const REQUIRED_SECTIONS = SECTION_SPECS.map((section) => section.name);

const DEFAULT_BUCKET = "manuscript-files";
const DEFAULT_TEMPLATE_PATH = "templates/jesam-manuscript-template.docx";
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

function normalizeHeading(value: string) {
  return value
    .replace(/^\d+(\.\d+)*\s*/, "")
    .replace(/[:.]+$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function headingMatchesAlias(heading: string, alias: string) {
  const normalizedHeading = normalizeHeading(heading);
  const normalizedAlias = normalizeHeading(alias);
  if (!normalizedHeading || !normalizedAlias) return false;
  return normalizedHeading === normalizedAlias || normalizedHeading.startsWith(`${normalizedAlias} `);
}

function normalizeComparableText(value: string) {
  return decodeXmlText(value)
    .toLowerCase()
    .replace(/[()[\]{}.,:;'"“”‘’]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isInstructionLikeText(value: string) {
  const text = normalizeComparableText(value);
  if (text.length < 8) return false;
  return (
    /\b(type|insert|enter|provide|replace|delete|remove|write|include|add|describe|indicate|do not|please|should|must|required|maximum|minimum)\b/.test(text) ||
    /^\(.+\)$/.test(value.trim())
  );
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
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
  return await data.arrayBuffer();
}

function buildLegacyDocReport(storagePath: string, templatePath: string) {
  const issues: Issue[] = [
    {
      code: "legacy-doc-manual-review",
      severity: "warning",
      message:
        "Legacy .doc files are accepted, but exact template structure cannot be parsed automatically. Please review formatting manually or request a .docx revision.",
    },
  ];

  return {
    passed: true,
    score: 70,
    checkedAt: new Date().toISOString(),
    templatePath,
    requiredSections: REQUIRED_SECTIONS.map((name) => ({
      name,
      found: false,
      order: null,
    })),
    headingSequence: [],
    figureCaptions: [],
    tableCaptions: [],
    imageCount: 0,
    wordCount: 0,
    issues,
    sourcePath: storagePath,
  };
}

function decodeXmlText(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTagValues(xml: string, tagName: string) {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "g");
  return [...xml.matchAll(pattern)].map((match) => match[1] ?? "");
}

function extractTextFromXml(xml: string) {
  return extractTagValues(xml, "w:t").map(decodeXmlText).join("");
}

function isRedColor(value: string) {
  const normalized = value.replace(/^#/, "").toLowerCase();
  if (normalized === "red" || normalized === "ff0000") return true;
  if (/^[0-9a-f]{6}$/.test(normalized)) {
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return r >= 150 && g <= 90 && b <= 90;
  }
  return false;
}

function extractRedParentheticalHints(documentXml: string) {
  const runs = extractTagValues(documentXml, "w:r").map((runXml) => {
    const colorMatch = runXml.match(/<w:color\b[^>]*w:val="([^"]+)"/);
    const text = extractTextFromXml(runXml);
    return {
      text,
      isRed: !!colorMatch && isRedColor(colorMatch[1]),
    };
  });

  const hints = new Set<string>();
  let buffer = "";
  for (const run of runs) {
    if (run.isRed) {
      buffer += run.text;
      continue;
    }
    if (buffer.trim()) {
      for (const match of buffer.matchAll(/\([^)]{6,}\)/g)) {
        hints.add(decodeXmlText(match[0]));
      }
    }
    buffer = "";
  }
  if (buffer.trim()) {
    for (const match of buffer.matchAll(/\([^)]{6,}\)/g)) {
      hints.add(decodeXmlText(match[0]));
    }
  }
  return [...hints];
}

function extractParagraphs(documentXml: string) {
  return extractTagValues(documentXml, "w:p").map((paragraphXml) => {
    const text = extractTagValues(paragraphXml, "w:t").map(decodeXmlText).join("");
    const styleMatch = paragraphXml.match(/<w:pStyle\b[^>]*w:val="([^"]+)"/);
    const style = styleMatch?.[1] ?? "";
    const fontMatches = [...paragraphXml.matchAll(/<w:rFonts\b[^>]*(?:w:ascii|w:hAnsi|w:cs)="([^"]+)"/g)]
      .map((match) => match[1])
      .filter(Boolean);
    const sizeMatches = [...paragraphXml.matchAll(/<w:sz\b[^>]*w:val="([^"]+)"/g)]
      .map((match) => Number(match[1]) / 2)
      .filter((size) => Number.isFinite(size));
    const lineMatch = paragraphXml.match(/<w:spacing\b[^>]*w:line="([^"]+)"/);
    const lineSpacing = lineMatch ? Number(lineMatch[1]) / 240 : undefined;
    return {
      text: text.replace(/\s+/g, " ").trim(),
      style,
      fonts: fontMatches,
      sizes: sizeMatches,
      lineSpacing,
    };
  }).filter((paragraph) => paragraph.text);
}

function findSectionOrder(
  spec: (typeof SECTION_SPECS)[number],
  paragraphsWithStyle: ReturnType<typeof extractParagraphs>
) {
  const headingIndex = paragraphsWithStyle.findIndex((paragraph) => {
    const styleLooksLikeHeading = /^heading/i.test(paragraph.style);
    return styleLooksLikeHeading && spec.aliases.some((alias) => headingMatchesAlias(paragraph.text, alias));
  });
  if (headingIndex >= 0) return headingIndex;

  return paragraphsWithStyle.findIndex((paragraph) =>
    spec.aliases.some((alias) => headingMatchesAlias(paragraph.text, alias))
  );
}

function ratio(part: number, whole: number) {
  return whole > 0 ? part / whole : 0;
}

async function docxToFeatures(arrayBuffer: ArrayBuffer) {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) {
    throw new TemplateCheckError("DOCX file is missing word/document.xml.");
  }

  const documentXml = await documentFile.async("string");
  const paragraphsWithStyle = extractParagraphs(documentXml);
  const paragraphs = paragraphsWithStyle.map((paragraph) => paragraph.text);
  const bodyText = paragraphs.join(" ").replace(/\s+/g, " ").trim();
  const normalizedBodyText = normalizeComparableText(bodyText);
  const headings = paragraphsWithStyle
    .filter((paragraph) => /^heading/i.test(paragraph.style))
    .map((paragraph) => paragraph.text);
  const normalizedHeadings = headings.map(normalizeHeading);
  const figureCaptions = paragraphs.filter((p) => /^fig(ure)?\.?\s*\d+[\s.:]/i.test(p));
  const tableCaptions = paragraphs.filter((p) => /^table\s*\d+[\s.:]/i.test(p));
  const imageCount =
    (documentXml.match(/<w:drawing\b/g) ?? []).length +
    (documentXml.match(/<w:pict\b/g) ?? []).length;
  const redParentheticalHints = extractRedParentheticalHints(documentXml);
  const nonLoremInstructionText = paragraphs
    .filter((paragraph) => !LOREM_RE.test(paragraph))
    .filter(isInstructionLikeText)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph, index, list) => list.indexOf(paragraph) === index);
  const directFonts = paragraphsWithStyle.flatMap((paragraph) => paragraph.fonts);
  const directSizes = paragraphsWithStyle.flatMap((paragraph) => paragraph.sizes);
  const directLineSpacings = paragraphsWithStyle
    .map((paragraph) => paragraph.lineSpacing)
    .filter((spacing): spacing is number => typeof spacing === "number" && Number.isFinite(spacing));
  const timesNewRomanRatio = ratio(
    directFonts.filter((font) => /times new roman/i.test(font)).length,
    directFonts.length
  );
  const size12Ratio = ratio(directSizes.filter((size) => Math.abs(size - 12) < 0.25).length, directSizes.length);
  const doubleSpacingRatio = ratio(
    directLineSpacings.filter((spacing) => Math.abs(spacing - 2) < 0.1).length,
    directLineSpacings.length
  );

  const requiredSections: SectionResult[] = SECTION_SPECS.map((section) => {
    const order = findSectionOrder(section, paragraphsWithStyle);
    return {
      name: section.name,
      found: order >= 0,
      order: order >= 0 ? order : null,
    };
  });

  return {
    bodyText,
    normalizedBodyText,
    headings,
    normalizedHeadings,
    paragraphs,
    figureCaptions,
    tableCaptions,
    imageCount,
    wordCount: countWords(bodyText),
    requiredSections,
    redParentheticalHints,
    nonLoremInstructionText,
    formatting: {
      directFontSamples: directFonts.length,
      directSizeSamples: directSizes.length,
      directLineSpacingSamples: directLineSpacings.length,
      timesNewRomanRatio,
      size12Ratio,
      doubleSpacingRatio,
    },
  };
}

type DocxFeatures = Awaited<ReturnType<typeof docxToFeatures>>;

function evaluateTemplate(submission: DocxFeatures, template: DocxFeatures, templatePath: string) {
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
      message: "Document appears too short for a full manuscript template check.",
    });
  }

  if (
    submission.formatting.directFontSamples >= 20 &&
    submission.formatting.timesNewRomanRatio < 0.75
  ) {
    issues.push({
      code: "font-family-mismatch",
      severity: "warning",
      message:
        "Most directly formatted text does not appear to use Times New Roman. The JESAM template expects Times New Roman.",
    });
  }

  if (submission.formatting.directSizeSamples >= 20 && submission.formatting.size12Ratio < 0.75) {
    issues.push({
      code: "font-size-mismatch",
      severity: "warning",
      message:
        "Most directly formatted text does not appear to use 12 pt font size. The JESAM template expects 12 pt.",
    });
  }

  if (
    submission.formatting.directLineSpacingSamples >= 10 &&
    submission.formatting.doubleSpacingRatio < 0.75
  ) {
    issues.push({
      code: "line-spacing-mismatch",
      severity: "warning",
      message:
        "Most directly formatted paragraphs do not appear to use 2.0 line spacing. The JESAM template expects double spacing.",
    });
  }

  if (template.headings.length > 0 && submission.headings.length === 0) {
    issues.push({
      code: "missing-heading-styles",
      severity: "error",
      message: "No Word heading styles were detected. Use the manuscript template heading styles.",
    });
  }

  if (submission.imageCount > 0 && submission.figureCaptions.length === 0) {
    issues.push({
      code: "missing-figure-captions",
      severity: "warning",
      message: "Embedded images were found but no Figure captions were detected.",
    });
  }

  const tableLikeText = submission.paragraphs.some((p) => /\btable\b/i.test(p));
  if (tableLikeText && submission.tableCaptions.length === 0) {
    issues.push({
      code: "missing-table-captions",
      severity: "warning",
      message: "Table-like content was found but no Table captions were detected.",
    });
  }

  const expectedTemplateSections = template.requiredSections.filter((section) => section.found);
  for (const section of expectedTemplateSections) {
    const inSubmission = submission.requiredSections.find((s) => s.name === section.name);
    if (!inSubmission?.found) {
      issues.push({
        code: "template-section-mismatch",
        severity: "error",
        message: `The base template includes ${section.name}, but the manuscript does not.`,
      });
    }
  }

  const leftoverHints = template.redParentheticalHints.filter((hint) => {
    const normalizedHint = normalizeComparableText(hint);
    return normalizedHint && submission.normalizedBodyText.includes(normalizedHint);
  });

  for (const hint of leftoverHints.slice(0, 5)) {
    issues.push({
      code: "unremoved-template-hint",
      severity: "error",
      message: `Template hint text still appears in the manuscript: ${hint}`,
    });
  }
  if (leftoverHints.length > 5) {
    issues.push({
      code: "multiple-template-hints",
      severity: "error",
      message: `${leftoverHints.length} red parenthesized template hint(s) appear to remain in the manuscript.`,
    });
  }

  const leftoverInstructions = template.nonLoremInstructionText.filter((instruction) => {
    const normalizedInstruction = normalizeComparableText(instruction);
    return (
      normalizedInstruction.length >= 18 &&
      submission.normalizedBodyText.includes(normalizedInstruction)
    );
  });

  for (const instruction of leftoverInstructions.slice(0, 4)) {
    issues.push({
      code: "unreplaced-template-instruction",
      severity: "warning",
      message: `Possible unreplaced template instruction remains: ${instruction}`,
    });
  }

  const bodyWithoutTemplateText = template.nonLoremInstructionText.reduce(
    (text, instruction) => text.replaceAll(normalizeComparableText(instruction), ""),
    submission.normalizedBodyText
  );
  const substantiveWordCount = countWords(
    bodyWithoutTemplateText.replace(LOREM_RE, " ").replace(/\s+/g, " ")
  );

  if (substantiveWordCount < 350) {
    issues.push({
      code: "low-substantive-content",
      severity: "error",
      message:
        "The manuscript appears to contain too little author-written content after excluding template instructions and placeholder text.",
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
    redTemplateHintsRemaining: leftoverHints,
    templateInstructionsRemaining: leftoverInstructions,
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
      templateBucket = DEFAULT_BUCKET,
      templatePath = Deno.env.get("JESAM_TEMPLATE_PATH") ?? DEFAULT_TEMPLATE_PATH,
    } = await req.json();

    if (!storagePath || typeof storagePath !== "string") {
      return jsonResponse({ error: "storagePath is required." }, 400, defaultHeaders);
    }
    const lowerPath = String(storagePath).toLowerCase();
    const isDocx = lowerPath.endsWith(".docx");
    const isDoc = lowerPath.endsWith(".doc");

    if (!isDocx && !isDoc) {
      return jsonResponse(
        { error: "Template check currently requires a Word .doc or .docx manuscript file." },
        400,
        defaultHeaders
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new TemplateCheckError("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    if (isDoc) {
      const report = buildLegacyDocReport(storagePath, templatePath);

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
          warnings: [
            "Legacy .doc file accepted for production checks; structural template parsing requires .docx.",
          ],
        },
        200,
        defaultHeaders
      );
    }

    const [submissionBuffer, templateBuffer] = await Promise.all([
      downloadObject(supabase, bucket, storagePath),
      downloadObject(supabase, templateBucket, templatePath),
    ]);

    const [submissionDoc, templateDoc] = await Promise.all([
      docxToFeatures(submissionBuffer),
      docxToFeatures(templateBuffer),
    ]);

    const report = evaluateTemplate(submissionDoc, templateDoc, templatePath);

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

    return jsonResponse({ report, warnings: [] }, 200, defaultHeaders);
  } catch (error) {
    console.error("Template check error:", error);
    const message = error instanceof Error ? error.message : "Template check failed.";
    const status = error instanceof TemplateCheckError ? error.status : 500;
    return jsonResponse({ error: message }, status, defaultHeaders);
  }
});
