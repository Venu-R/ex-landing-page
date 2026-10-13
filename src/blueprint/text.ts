/** Text helpers shared by the blueprint modules. */

export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "section"
  );
}

/** Normalise visible copy so DOCX text and Figma text compare equal. */
export function normText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Same as normText but also drops editorial numbering ("2. Site pricing"). */
export function normHeading(value: string): string {
  return normText(value.replace(/^\s*(?:(?:section|part)\s+)?\d+(?:\.\d+)*[.)\-:]?\s+/i, ""));
}

export function tokens(value: string): string[] {
  return normText(value).split(" ").filter(Boolean);
}

/** Layer names Figma generates by default carry no meaning. */
const GENERIC_NAME = /^(frame|group|rectangle|vector|line|ellipse|text|image|component|instance|section|auto layout(?: (?:horizontal|vertical))?|layer|boolean group|union|subtract|intersect|exclude)(?:\s+\d+)?$/i;
export function isGenericName(name: string): boolean {
  const trimmed = name.trim();
  return !trimmed || GENERIC_NAME.test(trimmed) || /^\d+[-:]\d+$/.test(trimmed);
}

/** Pull the file key and node id out of a Figma URL (design/file/proto/board). */
export function parseFigmaUrl(url: string | null | undefined): { fileKey: string | null; nodeId: string | null } {
  if (!url) return { fileKey: null, nodeId: null };
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/(?:design|file|proto|board)\/([A-Za-z0-9]+)/);
    const node = parsed.searchParams.get("node-id");
    return { fileKey: match?.[1] ?? null, nodeId: node ? node.replace("-", ":") : null };
  } catch {
    return { fileKey: null, nodeId: null };
  }
}
