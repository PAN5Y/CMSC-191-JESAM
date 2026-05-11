import assert from "node:assert/strict";
import test from "node:test";
import { toOptionalSummaryText } from "../../src/modules/journals-dashboard/queries/publicSearchShared.ts";

test("toOptionalSummaryText preserves a non-empty summary", () => {
  assert.equal(
    toOptionalSummaryText("Concise orientation for readers."),
    "Concise orientation for readers."
  );
});

test("toOptionalSummaryText trims surrounding whitespace", () => {
  assert.equal(
    toOptionalSummaryText("  Summary with surrounding space.  "),
    "Summary with surrounding space."
  );
});

test("toOptionalSummaryText omits empty summary content", () => {
  assert.equal(toOptionalSummaryText("   "), undefined);
  assert.equal(toOptionalSummaryText(null), undefined);
});
