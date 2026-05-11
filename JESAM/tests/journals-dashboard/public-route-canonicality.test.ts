import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const routerSource = readFileSync(
  path.resolve(currentDir, "../../src/router.tsx"),
  "utf8"
);

test("router keeps /journals canonical and redirects legacy aliases through the shared redirect component", () => {
  assert.match(routerSource, /function LegacyJournalsAliasRedirect/);
  assert.match(routerSource, /path:\s*"\/journals",\s*element:\s*<JournalsDashboardPage \/>/);
  assert.match(routerSource, /path:\s*"\/browse",\s*element:\s*<LegacyJournalsAliasRedirect \/>/);
  assert.match(
    routerSource,
    /path:\s*"\/journals\/public",\s*element:\s*<LegacyJournalsAliasRedirect \/>/
  );
});
