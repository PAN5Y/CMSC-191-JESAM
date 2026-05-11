import assert from "node:assert/strict";
import test from "node:test";
import { attemptPublicArticleDownload } from "../../src/modules/journals-dashboard/queries/publicArticleDownload.ts";

test("attemptPublicArticleDownload triggers browser download after a successful preflight", async () => {
  const originalFetch = globalThis.fetch;
  const originalDocument = globalThis.document;
  let clickedHref = "";

  try {
    globalThis.fetch = (async () =>
      new Response(null, { status: 200 })) as typeof fetch;
    globalThis.document = {
      createElement() {
        return {
          set href(value: string) {
            clickedHref = value;
          },
          get href() {
            return clickedHref;
          },
          rel: "",
          download: "",
          click() {},
        };
      },
    } as Document;

    const result = await attemptPublicArticleDownload(
      "https://example.com/storage/v1/object/public/manuscript-files/paper.pdf"
    );

    assert.equal(result.ok, true);
    assert.match(clickedHref, /download=1/);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.document = originalDocument;
  }
});

test("attemptPublicArticleDownload returns a recovery message when the preflight fails", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = (async () =>
      new Response(null, { status: 503 })) as typeof fetch;

    const result = await attemptPublicArticleDownload(
      "https://example.com/storage/v1/object/public/manuscript-files/paper.pdf"
    );

    assert.equal(result.ok, false);
    assert.match(result.message, /could not be reached/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
