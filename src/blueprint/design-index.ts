import { normText } from "./text";

export type Bounds = { x: number; y: number; width: number; height: number };
export type DNode = {
  id: string | null;
  name: string;
  type: string;
  text: string | null;
  bounds: Bounds | null;
  visible?: boolean | null;
  children: DNode[];
  [key: string]: any;
};

export type Entry = {
  node: DNode;
  parent: Entry | null;
  depth: number;
  /** Half-open range into DesignIndex.texts covered by this subtree (DFS order). */
  textStart: number;
  textEnd: number;
};

export type DesignIndex = {
  root: DNode;
  entries: Entry[];
  byId: Map<string, Entry>;
  texts: Array<{ entry: Entry; norm: string; raw: string }>;
};

export const CONTAINER_TYPES = new Set(["FRAME", "GROUP", "COMPONENT", "INSTANCE", "SECTION", "COMPONENT_SET"]);

/** Index a subtree. Hidden nodes (visible === false) are skipped: they are never rendered. */
export function buildIndex(root: DNode): DesignIndex {
  const entries: Entry[] = [];
  const byId = new Map<string, Entry>();
  const texts: DesignIndex["texts"] = [];
  const walk = (node: DNode, parent: Entry | null, depth: number) => {
    const entry: Entry = { node, parent, depth, textStart: texts.length, textEnd: 0 };
    entries.push(entry);
    if (node.id) byId.set(node.id, entry);
    if (node.type === "TEXT" && node.text) {
      const norm = normText(node.text);
      if (norm) texts.push({ entry, norm, raw: node.text });
    }
    for (const child of node.children) if (child.visible !== false) walk(child, entry, depth + 1);
    entry.textEnd = texts.length;
  };
  walk(root, null, 0);
  return { root, entries, byId, texts };
}

export function ancestorsOf(entry: Entry): Entry[] {
  const chain: Entry[] = [];
  for (let e = entry.parent; e; e = e.parent) chain.push(e);
  return chain; // nearest first
}

export function isWithin(inner: Entry, outer: Entry): boolean {
  for (let e: Entry | null = inner; e; e = e.parent) if (e === outer) return true;
  return false;
}

export function lowestCommonAncestor(entries: Entry[]): Entry | null {
  if (!entries.length) return null;
  let candidate: Entry | null = entries[0]!;
  for (const other of entries.slice(1)) {
    while (candidate && !isWithin(other, candidate)) candidate = candidate.parent;
    if (!candidate) return null;
  }
  return candidate;
}

export function area(node: DNode): number {
  return node.bounds ? Math.max(0, node.bounds.width) * Math.max(0, node.bounds.height) : 0;
}

// ---------------------------------------------------------------- viewports

export type Breakpoint = "desktop" | "tablet" | "mobile";
export type Viewport = {
  breakpoint: Breakpoint;
  nodeId: string | null;
  name: string;
  width: number;
  height: number;
  node: DNode;
};

function classify(node: DNode): Breakpoint {
  if (/mobile|phone/i.test(node.name)) return "mobile";
  if (/tablet|ipad/i.test(node.name)) return "tablet";
  if (/desktop|laptop/i.test(node.name)) return "desktop";
  const width = node.bounds?.width ?? 0;
  return width >= 1024 ? "desktop" : width >= 600 ? "tablet" : "mobile";
}

/**
 * Viewports are the top-level page frames on each canvas (descending into Figma
 * SECTIONs). Every viewport is matched against the same DOCX content, so a
 * desktop frame and a mobile frame in one file are paired automatically.
 */
export function detectViewports(document: DNode): Viewport[] {
  const found: DNode[] = [];
  const consider = (node: DNode) => {
    if (node.visible === false) return;
    if (node.type === "SECTION") return node.children.forEach(consider);
    const b = node.bounds;
    if (["FRAME", "COMPONENT", "INSTANCE"].includes(node.type) && b && b.width >= 280 && b.height >= 400) found.push(node);
  };
  if (document.type === "DOCUMENT") document.children.forEach((canvas) => canvas.children.forEach(consider));
  else if (document.type === "CANVAS") document.children.forEach(consider);
  else consider(document);
  return found.map((node) => ({
    breakpoint: classify(node),
    nodeId: node.id,
    name: node.name,
    width: node.bounds!.width,
    height: node.bounds!.height,
    node,
  }));
}

export function pickPrimary(viewports: Viewport[]): Viewport | null {
  const order: Breakpoint[] = ["desktop", "tablet", "mobile"];
  for (const bp of order) {
    const candidates = viewports.filter((v) => v.breakpoint === bp).sort((a, b) => b.width * b.height - a.width * a.height);
    if (candidates[0]) return candidates[0];
  }
  return null;
}
