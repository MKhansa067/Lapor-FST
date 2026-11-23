import assert from "node:assert/strict";
import test from "node:test";
import { isSimilarReportText, normalizeReportText } from "./duplicate-matcher";

test("matches related Indonesian problem vocabulary", () => {
  assert.equal(isSimilarReportText("AC mati di ruangan", "AC tidak berfungsi di ruangan"), true);
});

test("does not match clearly different problems", () => {
  assert.equal(isSimilarReportText("AC mati", "lampu berkedip"), false);
});

test("normalizes case punctuation and whitespace", () => {
  assert.deepEqual(normalizeReportText("  Pintu, RUSAK!  "), ["pintu", "rusak"]);
});
