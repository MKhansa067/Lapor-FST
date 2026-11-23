const STOP_WORDS = new Set([
  "ada", "dan", "di", "dengan", "ini", "itu", "ke", "karena", "pada", "yang"
]);

const RELATED_WORDS: Record<string, string> = {
  bermasalah: "rusak",
  mati: "rusak",
  macet: "rusak",
  gangguan: "rusak",
  "tidak berfungsi": "rusak",
  "tidak menyala": "rusak"
};

function canonicalize(value: string) {
  let text = value.toLocaleLowerCase("id-ID").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [phrase, replacement] of Object.entries(RELATED_WORDS)) {
    text = text.replaceAll(phrase, replacement);
  }
  return text.replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function normalizeReportText(value: string): string[] {
  return canonicalize(value).split(/\s+/).filter((token) => token && !STOP_WORDS.has(token));
}

export function isSimilarReportText(left: string, right: string): boolean {
  const leftTokens = new Set(normalizeReportText(left));
  const rightTokens = new Set(normalizeReportText(right));
  if (!leftTokens.size || !rightTokens.size) return false;
  const shared = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return shared >= 1 && shared / Math.min(leftTokens.size, rightTokens.size) >= 0.5;
}
