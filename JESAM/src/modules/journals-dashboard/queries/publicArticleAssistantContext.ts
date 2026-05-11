import type { PublicArticleDetail, PublicArticleSearchResult } from "../types";

export function buildPublicArticleAssistantContext(
  article: PublicArticleDetail
) {
  const lines = [
    `Article title: ${article.title}`,
    `Journal: ${article.journalTitle}`,
    article.authors.length > 0
      ? `Authors: ${article.authors.join(", ")}`
      : null,
    article.classification ? `Topic area: ${article.classification}` : null,
    article.publishedAt ? `Published at: ${article.publishedAt}` : null,
    article.issueLabel ? `Publication details: ${article.issueLabel}` : null,
    article.doi ? `DOI: ${article.doi}` : null,
    article.keywords.length > 0
      ? `Keywords: ${article.keywords.join(", ")}`
      : "Keywords: not listed",
    article.summary ? `Summary: ${article.summary}` : null,
    article.abstract ? `Abstract: ${article.abstract}` : null,
    "Constraint: Use only the public article details above and public JESAM archive search results. Do not imply access to internal, editorial, or unpublished information.",
  ];

  return lines.filter(Boolean).join("\n");
}

export function buildPublicArticleAssistantWelcome(
  article: PublicArticleDetail
) {
  return `Hello. I can help with this public article by:

- explaining the title, abstract, summary, and keywords already shown on the page
- highlighting terms or concepts worth following up
- searching for related public JESAM papers

You are currently viewing: "${article.title}"`;
}

export interface ArticleAssistantShortcut {
  label: string;
  prompt: string;
}

export function buildPublicArticleAssistantShortcuts(
  article: PublicArticleDetail
): ArticleAssistantShortcut[] {
  const topicCue =
    article.keywords.slice(0, 3).join(", ") ||
    article.classification?.toLowerCase() ||
    article.title;

  return [
    {
      label: "Key ideas",
      prompt: `What are the key ideas or findings in "${article.title}"?`,
    },
    {
      label: "Important terms",
      prompt: `Which terms, concepts, or methods from "${article.title}" should I pay attention to?`,
    },
    {
      label: "Related JESAM papers",
      prompt: `Find related JESAM papers about ${topicCue}.`,
    },
  ];
}

export function formatRelatedResultMeta(
  result: PublicArticleSearchResult
) {
  const segments = [
    result.journalTitle,
    result.classification,
    result.publishedAt
      ? new Date(result.publishedAt).getFullYear().toString()
      : undefined,
  ].filter(Boolean);

  return segments.join(" • ");
}
