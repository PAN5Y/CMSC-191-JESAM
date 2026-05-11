import assert from "node:assert/strict";
import test from "node:test";
import { normalizeManuscriptRow } from "../../src/types.ts";

test("normalizeManuscriptRow maps a nullable summary column into public_summary", () => {
  const manuscript = normalizeManuscriptRow({
    id: "m-1",
    title: "Example",
    abstract: "Abstract",
    summary: "Short summary.",
    authors: ["Author One"],
    keywords: ["alpha"],
    status: "Published",
    classification: "Land",
    created_at: "2026-05-11T00:00:00.000Z",
  });

  assert.equal(manuscript.public_summary, "Short summary.");
});

test("normalizeManuscriptRow trims empty summary values to null", () => {
  const manuscript = normalizeManuscriptRow({
    id: "m-2",
    title: "Example",
    abstract: "Abstract",
    summary: "   ",
    authors: ["Author One"],
    keywords: ["alpha"],
    status: "Published",
    classification: "Land",
    created_at: "2026-05-11T00:00:00.000Z",
  });

  assert.equal(manuscript.public_summary, null);
});
