import assert from "node:assert/strict";
import test from "node:test";
import {
  LEGACY_PUBLIC_ARTICLE_DETAIL_SELECT,
  PUBLIC_ARTICLE_DETAIL_SELECT,
  shouldRetryLegacyPublicArticleDetailQuery,
} from "../../src/modules/journals-dashboard/queries/publicArticleDetailContract.ts";

test("public article detail select includes explicit download availability fields", () => {
  assert.match(PUBLIC_ARTICLE_DETAIL_SELECT, /download_availability_status/);
  assert.match(PUBLIC_ARTICLE_DETAIL_SELECT, /is_downloadable/);
  assert.match(PUBLIC_ARTICLE_DETAIL_SELECT, /download_url/);
});

test("legacy public article detail select stays backward-compatible", () => {
  assert.doesNotMatch(LEGACY_PUBLIC_ARTICLE_DETAIL_SELECT, /summary/);
  assert.doesNotMatch(LEGACY_PUBLIC_ARTICLE_DETAIL_SELECT, /download_availability_status/);
});

test("legacy contract retry only triggers for known missing-field diagnostics", () => {
  assert.equal(
    shouldRetryLegacyPublicArticleDetailQuery({
      code: "PGRST204",
      message: "column summary does not exist",
    }),
    true
  );
  assert.equal(
    shouldRetryLegacyPublicArticleDetailQuery({
      code: "42703",
      details: "download_availability_status missing from view",
    }),
    true
  );
  assert.equal(
    shouldRetryLegacyPublicArticleDetailQuery({
      code: "42703",
      message: "authors column has unexpected type",
    }),
    false
  );
});
