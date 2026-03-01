const suffixes = [
  "comparison",
  "grade difference",
  "technical analysis",
  "properties & strength",
  "procurement guide",
  "industrial use",
];

export function generateAnchorVariation(base: string): string {
  const idx = Math.abs(hashCode(base)) % suffixes.length;
  return `${base} ${suffixes[idx]}`;
}

/** Deterministic hash so anchor text is stable across renders */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
