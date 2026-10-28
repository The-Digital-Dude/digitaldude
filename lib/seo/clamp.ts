/** Keep a meta description within what search results show: cut at a word boundary, add an ellipsis. */
export function clampDescription(text: string, max = 158): string {
  const s = text.replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 40)).replace(/[\s,;:.\-–—]+$/, "")}…`;
}
