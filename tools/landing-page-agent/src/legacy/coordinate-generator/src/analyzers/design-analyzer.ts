import type { PlanBandRole } from "@bdmg/types";

import { visiblePaints } from "../design/css.js";
import { isVisible, textLeaves, type DNode } from "../design/types.js";
import type { NodeRole } from "../design/render-tree.js";
import { normHeading } from "../utils/text.js";

/**
 * Design analysis: which top-level bands the page is made of, and what
 * semantic role (heading / link / button / header / footer) each node plays.
 *
 * Figma layer names are usually meaningless ("Frame 12"), so every rule uses
 * geometry and text only. Nothing here is specific to one landing page.
 */

export interface BandCandidate {
  node: DNode;
  /** Order of discovery = Figma layer order (bottom to top). */
  layerOrder: number;
}

export interface BandAnalysis {
  bands: BandCandidate[];
  /** Direct (non-band) children found while descending page-sized wrappers. */
  loose: Array<{ node: DNode; parent: DNode }>;
  /** Solid colour of the page canvas, if the root or a wrapper has one. */
  background?: string | undefined;
  /** Page-sized wrapper frames that were descended into (ids). */
  wrappers: string[];
}

const BAND_MIN_WIDTH = 0.9;
const PAGE_MAX_HEIGHT = 0.85;

const area = (n: DNode) => (n.bounds ? n.bounds.width * n.bounds.height : 0);

function solidFill(node: DNode): string | undefined {
  const paint = [...visiblePaints(node.fills)].reverse().find((p) => p.type === "SOLID" && p.color);
  if (!paint?.color) return undefined;
  const c = paint.color;
  const a = (c.a ?? 1) * (paint.opacity ?? 1);
  const h = (v: number | undefined) => Math.round((v ?? 0) * 255);
  return a >= 0.999 ? `rgb(${h(c.r)}, ${h(c.g)}, ${h(c.b)})` : `rgba(${h(c.r)}, ${h(c.g)}, ${h(c.b)}, ${Number(a.toFixed(3))})`;
}

/**
 * Bands = outermost full-width containers that are not page-sized themselves.
 * Page-sized wrappers (a single frame holding the whole page) are descended into.
 */
export function findBands(root: DNode): BandAnalysis {
  const rb = root.bounds;
  const result: BandAnalysis = { bands: [], loose: [], background: solidFill(root), wrappers: [] };
  if (!rb) return result;
  let order = 0;

  const visit = (node: DNode, parent: DNode) => {
    if (!isVisible(node) || !node.bounds || area(node) <= 0) return;
    const wide = node.bounds.width >= rb.width * BAND_MIN_WIDTH;
    const container = ["FRAME", "GROUP", "COMPONENT", "INSTANCE", "SECTION", "COMPONENT_SET"].includes(node.type);
    if (container && wide && node.bounds.height < rb.height * PAGE_MAX_HEIGHT) {
      result.bands.push({ node, layerOrder: order++ });
    } else if (container && wide) {
      // Page-sized wrapper: keep its background, then look inside.
      result.wrappers.push(node.id ?? "");
      result.background ??= solidFill(node);
      for (const child of node.children) visit(child, node);
    } else {
      result.loose.push({ node, parent });
      order++;
    }
  };
  for (const child of root.children) visit(child, root);
  return result;
}

// ----------------------------------------------------------------------- roles

export interface RoleOptions {
  /** Titles of blueprint sections (used to recognise column headings). */
  sectionTitles: string[];
  headingMinSize: number;
  subheadingMinSize: number;
}

export const DEFAULT_ROLE_OPTIONS: Omit<RoleOptions, "sectionTitles"> = {
  headingMinSize: 28,
  subheadingMinSize: 22
};

const MAX_BUTTON = { width: 360, height: 80 };

function visibleChildren(n: DNode): DNode[] {
  return n.children.filter(isVisible);
}

export function bandRole(
  band: DNode,
  root: DNode,
  all: DNode[],
  sectionTitles: string[],
): PlanBandRole {
  const rb = root.bounds!;
  const b = band.bounds!;
  const titles = sectionTitles.join(" ").toLowerCase();
  const texts = textLeaves(band);
  const byName = `${band.name} ${titles}`.toLowerCase();
  if (/\bfooter\b/.test(byName)) return "footer";
  if (/\b(nav|navigation|header|menu)\b/.test(byName) && b.height < rb.height * 0.15) return "header";
  const isFirst = b.y - rb.y < rb.height * 0.05;
  const isLast = b.y + b.height >= rb.y + rb.height - 4;
  const lastBand = all.reduce((acc, n) => (!acc || n.bounds!.y > acc.bounds!.y ? n : acc), null as DNode | null);
  const sizes = texts.map((t) => t.style?.fontSize ?? 16);
  const avg = sizes.length ? sizes.reduce((x, y) => x + y, 0) / sizes.length : 16;
  if (isFirst && b.height < rb.height * 0.12 && texts.length >= 3 && avg <= 22) return "header";
  if (isLast && lastBand === band && texts.length >= 8 && avg <= 22) return "footer";
  return "section";
}

function clusterRank(sizes: number[]): Map<number, number> {
  const sorted = [...new Set(sizes)].sort((a, b) => b - a);
  const rank = new Map<number, number>();
  let cluster = -1;
  let previous = Infinity;
  for (const size of sorted) {
    if (previous - size > 6) cluster += 1;
    previous = size;
    rank.set(size, Math.max(cluster, 0));
  }
  return rank;
}

/**
 * Semantic tags for TEXT nodes and a few containers. This changes only the HTML
 * element used (h1/h2/a/button ...), never the visual result, because each
 * element is fully styled from the design.
 */
export function assignRoles(
  bands: Array<{ node: DNode; role: PlanBandRole; sectionIds: string[] }>,
  options: RoleOptions,
): Map<string, NodeRole> {
  const roles = new Map<string, NodeRole>();
  const set = (node: DNode, role: NodeRole) => {
    if (node.id) roles.set(node.id, { ...(roles.get(node.id) ?? {}), ...role });
  };
  const headingTitles = new Set(options.sectionTitles.map(normHeading).filter(Boolean));

  // 1) links and buttons
  for (const band of bands) {
    const inHeader = band.role === "header";
    const inFooter = band.role === "footer";
    if (inHeader) set(band.node, { tag: "header" });
    else if (inFooter) set(band.node, { tag: "footer" });
    else set(band.node, { tag: "section" });

    const visit = (node: DNode, insideLink: boolean) => {
      if (!isVisible(node)) return;
      let nowInside = insideLink;
      if (node !== band.node && node.bounds && !insideLink && node.type !== "TEXT") {
        const texts = textLeaves(node);
        const kids = visibleChildren(node);
        const small = node.bounds.width <= MAX_BUTTON.width && node.bounds.height <= MAX_BUTTON.height;
        if (kids.length > 0 && small && texts.length === 1 && texts[0]!.text!.length <= 40) {
          const decorated =
            visiblePaints(node.fills).length > 0 ||
            visiblePaints(node.strokes).length > 0 ||
            (node.cornerRadius ?? 0) > 0;
          if (inHeader || decorated) {
            set(node, { tag: "a", href: "#" });
            set(texts[0]!, { tag: "span" });
            nowInside = true;
          }
        }
      }
      for (const child of node.children) visit(child, nowInside);
    };
    visit(band.node, false);

    if (inHeader) {
      for (const text of textLeaves(band.node)) {
        if (!roles.has(text.id ?? "")) set(text, { tag: "a", href: "#" });
      }
    }
    if (inFooter) {
      for (const text of textLeaves(band.node)) {
        const value = text.text ?? "";
        const size = text.style?.fontSize ?? 16;
        if (roles.has(text.id ?? "")) continue;
        if (headingTitles.has(normHeading(value))) set(text, { tag: "h3" });
        else if (value.length <= 40 && !/©|\(c\)/i.test(value) && size <= 22) set(text, { tag: "a", href: "#" });
      }
    }
  }

  // 2) headings (page-wide so the h1 is unique)
  const candidates: DNode[] = [];
  for (const band of bands) {
    if (band.role === "header" || band.role === "footer") continue;
    for (const text of textLeaves(band.node)) {
      const size = text.style?.fontSize ?? 0;
      const value = text.text ?? "";
      if (roles.get(text.id ?? "")?.tag) continue;
      if (size >= options.headingMinSize && !/[\d$%€£]/.test(value) && value.length <= 60) candidates.push(text);
    }
  }
  candidates.sort((a, b) => a.bounds!.y - b.bounds!.y || a.bounds!.x - b.bounds!.x);
  const rank = clusterRank(candidates.map((c) => c.style?.fontSize ?? 0));
  candidates.forEach((text, index) => {
    const cluster = rank.get(text.style?.fontSize ?? 0) ?? 0;
    const level = index === 0 ? 1 : Math.min(4, 2 + cluster);
    set(text, { tag: `h${level}` });
  });
  for (const band of bands) {
    if (band.role === "header" || band.role === "footer") continue;
    for (const text of textLeaves(band.node)) {
      const size = text.style?.fontSize ?? 0;
      if (roles.get(text.id ?? "")?.tag) continue;
      if (size >= options.subheadingMinSize && size < options.headingMinSize && !/[\d$%€£]/.test(text.text ?? "") && (text.text ?? "").length <= 50) {
        set(text, { tag: "h3" });
      }
    }
  }
  return roles;
}

export { bandRole as classifyBand };
