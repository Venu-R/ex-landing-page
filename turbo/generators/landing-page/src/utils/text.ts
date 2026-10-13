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

/** Same as normText but drops editorial numbering ("2. Site pricing"). */
export function normHeading(value: string): string {
  return normText(value.replace(/^\s*(?:(?:section|part)\s+)?\d+(?:\.\d+)*[.)\-:]?\s+/i, ""));
}

/** Break one run of DOCX copy into the pieces a designer typeset separately. */
export function splitFragments(text: string): string[] {
  const out = new Set<string>();
  const add = (value: string) => {
    const t = value.trim();
    if (t) out.add(t);
  };
  add(text);
  const pieces = text.split(/\s*[|;\n]\s*|\s+[—–]\s+|(?<=[A-Za-z]{4,}[.!?])\s+(?=[A-Z$])/);
  for (const piece of pieces) {
    add(piece);
    const labelled = piece.match(/^[A-Za-z][A-Za-z0-9 &/\-]{0,38}:\s+(.+)$/);
    const body = labelled ? labelled[1]! : piece;
    if (labelled) add(body);
    for (const part of body.split(/,\s+/)) add(part.replace(/[.!?]+$/, ""));
  }
  return [...out];
}
