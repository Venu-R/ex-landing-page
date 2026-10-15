import type { BlueprintSection, PlanReportItem } from "@bdmg/types";

import { normText, splitFragments } from "../utils/text.js";
import { textLeaves, type DNode } from "../design/types.js";

export interface ContentBinding {
  /** Figma TEXT node id -> copy as written in the DOCX. */
  overrides: Map<string, string>;
  /** Design text that is bound to a DOCX block but worded differently. */
  mismatches: PlanReportItem[];
  /** DOCX fragments that no design text carries (not rendered). */
  unrendered: PlanReportItem[];
}

function blockTexts(block: BlueprintSection["content"][number]): string[] {
  if (block.type === "heading" || block.type === "paragraph") return block.text ? [block.text] : [];
  if (block.type === "list") return block.items ?? [];
  if (block.type === "table") {
    const rows = block.cells?.length ? block.cells.map((r) => r.map((c) => c.text)) : (block.rows ?? []);
    return rows.flat().flatMap((cell) => cell.split("\n"));
  }
  return [];
}

/**
 * Copy from the DOCX is the source of truth. The blueprint already records which
 * Figma TEXT nodes carry each content block (`designTextNodeIds`). For each such
 * node we look for the DOCX fragment that says the same thing; when only the
 * spelling, case or punctuation differs, the DOCX wording wins. A node whose
 * wording really differs is left alone and reported, so a layout is never
 * silently rewritten with unrelated copy.
 */
export function bindContent(sections: BlueprintSection[], designRoots: DNode[]): ContentBinding {
  const designText = new Map<string, string>();
  for (const root of designRoots) for (const t of textLeaves(root)) if (t.id && t.text) designText.set(t.id, t.text);

  const overrides = new Map<string, string>();
  const mismatches: PlanReportItem[] = [];
  const unrendered: PlanReportItem[] = [];

  for (const section of sections) {
    if (section.kind !== "section") continue;
    for (const block of section.content) {
      const nodeIds = (block as { designTextNodeIds?: string[] }).designTextNodeIds ?? [];
      if (!nodeIds.length || block.type === "heading") continue;
      const fragments = blockTexts(block).flatMap(splitFragments);
      const byNorm = new Map<string, string>();
      for (const f of fragments) {
        const key = normText(f);
        // Prefer the shortest fragment per key: it is the cleanest cut of the copy.
        if (key && (!byNorm.has(key) || f.length < byNorm.get(key)!.length)) byNorm.set(key, f);
      }
      for (const id of nodeIds) {
        const design = designText.get(id);
        if (design === undefined) continue;
        const fragment = byNorm.get(normText(design));
        if (fragment === undefined) {
          mismatches.push({
            code: "copy-mismatch",
            nodeId: id,
            sectionId: section.id,
            message: `Design text "${design.slice(0, 60)}" is bound to DOCX block ${block.id} but no fragment of that block says the same thing.`
          });
        } else if (fragment.trim() !== design.trim() && !design.includes("\n")) {
          overrides.set(id, fragment.trim());
        }
      }
    }
    for (const missing of section.designMatch.contentNotInDesign) {
      unrendered.push({
        code: "content-not-in-design",
        sectionId: section.id,
        message: `"${missing.slice(0, 80)}" is in the DOCX but not in the Figma text, so it is not rendered.`
      });
    }
  }
  return { overrides, mismatches, unrendered };
}
