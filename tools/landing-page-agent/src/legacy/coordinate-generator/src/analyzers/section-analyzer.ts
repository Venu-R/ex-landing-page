import type { BlueprintSection, PlanBandRole, PlanReportItem } from "@bdmg/types";

import { isVisible, type DNode } from "../design/types.js";

export interface BandSections {
  sectionIds: string[];
  label: string | null;
}

function contains(outer: DNode, id: string): boolean {
  if (outer.id === id) return true;
  return outer.children.some((c) => isVisible(c) && contains(c, id));
}

/**
 * Pair blueprint sections with the page bands that hold their copy and report
 * mismatches: visual sections the design does not contain, and design bands no
 * section describes (these still render, but nobody wrote copy for them).
 */
export function analyzeSections(
  sections: BlueprintSection[],
  bands: Array<{ node: DNode; role: PlanBandRole }>,
): { byBand: Map<string, BandSections>; report: PlanReportItem[] } {
  const byBand = new Map<string, BandSections>();
  const report: PlanReportItem[] = [];
  for (const band of bands) if (band.node.id) byBand.set(band.node.id, { sectionIds: [], label: null });

  for (const section of sections) {
    if (section.kind !== "section") continue;
    const nodeId = section.designNodeId;
    if (!nodeId || section.designMatch.status !== "matched") {
      report.push({
        code: "section-unmapped",
        sectionId: section.id,
        message: `Section "${section.title}" has no design node; it is not rendered. Pin one with sectionOverrides in bdmg.blueprint.json.`
      });
      continue;
    }
    const band = bands.find((b) => b.node.id && contains(b.node, nodeId));
    if (!band?.node.id) {
      report.push({
        code: "section-outside-bands",
        sectionId: section.id,
        nodeId,
        message: `Section "${section.title}" maps to ${nodeId}, which is not inside any page band.`
      });
      continue;
    }
    const entry = byBand.get(band.node.id)!;
    entry.sectionIds.push(section.id);
    // Label a band with its top-level section title (hierarchy level 1 wins).
    if (!entry.label || (section.parentId === null && section.title)) entry.label ??= section.title;
  }

  for (const band of bands) {
    const entry = band.node.id ? byBand.get(band.node.id) : undefined;
    if (entry && !entry.sectionIds.length) {
      report.push({
        code: "band-without-section",
        nodeId: band.node.id,
        message: `Design band "${band.node.name}" (${band.node.id}) has no matching content section. It is rendered from the design as-is.`
      });
    }
  }
  return { byBand, report };
}
