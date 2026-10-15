import type {
  LandingPageBlueprint,
  PagePlan,
  PlanBand,
  PlanFont,
  PlanNode,
  PlanReportItem,
  PlanViewport
} from "@bdmg/types";

import { analyzeAssets } from "../analyzers/asset-analyzer.js";
import {
  DEFAULT_ROLE_OPTIONS,
  assignRoles,
  bandRole,
  findBands
} from "../analyzers/design-analyzer.js";
import { analyzeSections } from "../analyzers/section-analyzer.js";
import { visiblePaints } from "../design/css.js";
import { buildPlanNode, type BuildContext } from "../design/render-tree.js";
import { SkinRegistry } from "../design/skins.js";
import { findNode, type DNode } from "../design/types.js";
import { bindContent } from "./bind-content.js";

export interface BuildPageOptions {
  headingMinSize?: number;
  subheadingMinSize?: number;
}

export interface BuildPageResult {
  plan: PagePlan;
  /** Contents of design.css (one class per distinct visual style). */
  css: string;
}

function solid(node: DNode): string | undefined {
  const paint = [...visiblePaints(node.fills)].reverse().find((p) => p.type === "SOLID" && p.color);
  if (!paint?.color) return undefined;
  const c = paint.color;
  const a = (c.a ?? 1) * (paint.opacity ?? 1);
  const h = (v: number | undefined) => Math.round((v ?? 0) * 255);
  return a >= 0.999 ? `rgb(${h(c.r)}, ${h(c.g)}, ${h(c.b)})` : `rgba(${h(c.r)}, ${h(c.g)}, ${h(c.b)}, ${Number(a.toFixed(3))})`;
}

/** Breakpoint -> media-query window, derived from which designs exist. */
function windows(breakpoints: Array<"desktop" | "tablet" | "mobile">) {
  const has = new Set(breakpoints);
  const result = new Map<string, { min: number | null; max: number | null }>();
  const mobileMax = 767;
  const tabletMax = 1023;
  for (const bp of has) {
    if (has.size === 1) result.set(bp, { min: null, max: null });
    else if (bp === "mobile") result.set(bp, { min: null, max: has.has("tablet") ? mobileMax : tabletMax });
    else if (bp === "tablet") result.set(bp, { min: mobileMax + 1, max: has.has("desktop") ? tabletMax : null });
    else result.set(bp, { min: has.has("tablet") ? tabletMax + 1 : mobileMax + 1, max: null });
  }
  return result;
}

export function buildPagePlan(blueprint: LandingPageBlueprint, options: BuildPageOptions = {}): BuildPageResult {
  const document = blueprint.design.document as unknown as DNode;
  const skins = new SkinRegistry();
  const assets = analyzeAssets(blueprint.assets ?? []);
  const warnings: PlanReportItem[] = [];
  const info: PlanReportItem[] = [];

  const viewportDefs = blueprint.design.canvas.viewports ?? [];
  const roots = viewportDefs
    .map((vp) => ({ vp, node: vp.nodeId ? findNode(document, vp.nodeId) : null }))
    .filter((v): v is { vp: (typeof viewportDefs)[number]; node: DNode } => Boolean(v.node));
  if (!roots.length) throw new Error("The blueprint lists no usable viewport frame (design.canvas.viewports).");

  const binding = bindContent(blueprint.sections, roots.map((r) => r.node));
  warnings.push(...binding.mismatches);
  info.push(...binding.unrendered);

  const sectionTitles = blueprint.sections.filter((s) => s.kind === "section").map((s) => s.title);
  const ctx: BuildContext = {
    skins,
    resolveImage: (ref) => (ref ? (assets.imageByRef.get(ref) ?? null) : null),
    iconAssets: assets.iconByNodeId,
    textOverrides: binding.overrides,
    roles: new Map(),
    fonts: new Map(),
    stats: { nodes: 0, skipped: 0, textOverrides: 0, pendingImages: 0, vectorsWithoutGeometry: 0 },
    warnings
  };

  const windowFor = windows(roots.map((r) => r.vp.breakpoint));
  const viewports: PlanViewport[] = [];

  for (const { vp, node: root } of roots) {
    const rb = root.bounds!;
    const analysis = findBands(root);
    const classified = analysis.bands.map((b) => ({
      node: b.node,
      layerOrder: b.layerOrder,
      role: bandRole(b.node, root, analysis.bands.map((x) => x.node), []),
      sectionIds: [] as string[]
    }));

    // Pair sections with bands (primary viewport only: sections are matched there).
    const paired = analyzeSections(blueprint.sections, classified);
    if (vp.primary) warnings.push(...paired.report);
    for (const band of classified) {
      const entry = band.node.id ? paired.byBand.get(band.node.id) : undefined;
      band.sectionIds = entry?.sectionIds ?? [];
      // Re-evaluate the role now that the section titles are known.
      const titles = band.sectionIds.map((id) => blueprint.sections.find((s) => s.id === id)?.title ?? "");
      band.role = bandRole(band.node, root, analysis.bands.map((x) => x.node), titles);
    }

    const roles = assignRoles(classified, {
      sectionTitles,
      headingMinSize: options.headingMinSize ?? DEFAULT_ROLE_OPTIONS.headingMinSize,
      subheadingMinSize: options.subheadingMinSize ?? DEFAULT_ROLE_OPTIONS.subheadingMinSize
    });
    for (const [id, role] of roles) ctx.roles.set(id, role);

    const bands: PlanBand[] = [];
    classified
      .slice()
      .sort((a, b) => a.node.bounds!.y - b.node.bounds!.y)
      .forEach((band) => {
        const b = band.node.bounds!;
        const built = buildPlanNode(band.node, null, ctx);
        if (!built) return;
        // The band root sits at the top-left of its canvas.
        built.box = { position: "absolute", left: "0", top: "0", width: `${b.width}px`, height: `${b.height}px` };
        const entry = band.node.id ? paired.byBand.get(band.node.id) : undefined;
        const bleed = solid(band.node);
        bands.push({
          id: band.node.id ?? "",
          name: band.node.name,
          role: band.role,
          sectionIds: band.sectionIds,
          label: entry?.label ?? null,
          top: Number((b.y - rb.y).toFixed(2)),
          height: Number(b.height.toFixed(2)),
          zIndex: band.layerOrder + 1,
          ...(bleed ? { bleedBackground: bleed } : {}),
          root: built
        });
      });

    if (analysis.loose.length) {
      const children: PlanNode[] = [];
      for (const { node, parent } of analysis.loose) {
        const built = buildPlanNode(node, parent, ctx);
        if (built) children.push(built);
      }
      if (children.length) {
        bands.push({
          id: `${root.id}-loose`,
          name: "Loose layers",
          role: "loose",
          sectionIds: [],
          label: null,
          top: 0,
          height: rb.height,
          zIndex: analysis.bands.length + 2,
          root: {
            id: `${root.id}-loose`,
            name: "Loose layers",
            kind: "box",
            tag: "div",
            box: { position: "absolute", left: "0", top: "0", width: `${rb.width}px`, height: `${rb.height}px`, pointerEvents: "none" },
            children
          }
        });
        warnings.push({
          code: "loose-layers",
          message: `${children.length} layer(s) sit outside any full-width band in viewport ${vp.name}; they are drawn over the page at their design position.`
        });
      }
    }

    const win = windowFor.get(vp.breakpoint) ?? { min: null, max: null };
    viewports.push({
      breakpoint: vp.breakpoint,
      nodeId: vp.nodeId,
      designWidth: Number(rb.width.toFixed(2)),
      designHeight: Number(rb.height.toFixed(2)),
      minWidth: win.min,
      maxWidth: win.max,
      ...(analysis.background ? { background: analysis.background } : {}),
      bands
    });
  }

  if (ctx.stats.vectorsWithoutGeometry) {
    warnings.push({
      code: "vectors-without-geometry",
      message: `${ctx.stats.vectorsWithoutGeometry} vector layer(s) (icons, check marks, chevrons) cannot be drawn: figma-response.json was fetched without geometry=paths and no icon SVGs were delivered. Run "pnpm figma:fetch" (or deliver the SVGs listed in the asset manifest).`
    });
  }
  if (ctx.stats.pendingImages) {
    warnings.push({
      code: "images-pending",
      message: `${ctx.stats.pendingImages} image fill(s) have no delivered file yet; their boxes render transparent.`
    });
  }
  warnings.push(...assets.report);

  const fonts: PlanFont[] = [...ctx.fonts].map(([family, f]) => ({
    family,
    weights: [...f.weights].sort((a, b) => a - b),
    italic: f.italic
  }));

  const plan: PagePlan = {
    schemaVersion: "1.0.0",
    project: blueprint.project,
    generatedAt: new Date().toISOString(),
    source: {
      blueprintSchema: blueprint.schemaVersion,
      figmaFileKey: blueprint.source.figmaFileKey,
      figmaUrl: blueprint.source.designSourceUrl
    },
    fonts,
    viewports,
    assets: assets.refs,
    report: {
      nodes: ctx.stats.nodes,
      skippedNodes: ctx.stats.skipped,
      textOverrides: ctx.stats.textOverrides,
      warnings,
      info
    }
  };
  return { plan, css: skins.css() };
}
