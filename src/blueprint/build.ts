import { z } from "zod";
import { collectAssets } from "./assets";
import {
  area, buildIndex, detectViewports, isWithin, pickPrimary,
  type Breakpoint, type DNode, type DesignIndex, type Entry,
} from "./design-index";
import { DEFAULT_NON_VISUAL, groupContent, matchSections, type ContentBlock, type SectionMatch } from "./matcher";
import {
  BlueprintSchema, NormalizedContentSchema, NormalizedDesignSchema, type Blueprint,
} from "./schema";
import { normHeading, parseFigmaUrl, slugify } from "./text";

export type BlueprintConfig = {
  project?: string;
  framework?: string;
  figmaUrl?: string;
  /** heading (numbering ignored) or section id ("07") -> Figma node id. Use to pin a mapping by hand. */
  sectionOverrides?: Record<string, string>;
  /** headings to treat as non-visual notes; plain text or "/regex/i". */
  ignoreSections?: string[];
  nonVisualPattern?: string;
  minConfidence?: number;
  iconMaxSize?: number;
  /** Breakpoints the client must have designs for. Missing ones become warnings. */
  requiredBreakpoints?: Breakpoint[];
  /** Turn pending assets into a warning (use right before generation). */
  requireAssets?: boolean;
  /** Copy each section's full Figma subtree into the section (large; design.document already holds it). */
  embedSubtrees?: boolean;
  assets?: { dir?: string; basePath?: string; map?: Record<string, string> };
};

export type BuildInput = {
  content: unknown;
  design: unknown;
  contentFile: string;
  designFile: string;
  config?: BlueprintConfig;
  /** Absolute assets directory (resolved by the caller). */
  assetsDir?: string | undefined;
};

type Block = z.infer<typeof NormalizedContentSchema>["blocks"][number];

function contentItem(block: Block, index: number, bindings?: string[]) {
  const b = block as any;
  return {
    id: `content-${index + 1}`,
    type: block.type,
    ...("text" in b ? { text: b.text } : {}),
    ...("level" in b ? { level: b.level } : {}),
    ...("ordered" in b ? { ordered: b.ordered, items: b.items } : {}),
    ...("rows" in b ? { rows: b.rows } : {}),
    ...(block.type === "table" && b.cells ? { cells: b.cells } : {}),
    ...("links" in b && b.links ? { links: b.links } : {}),
    ...(block.type === "image" ? { image: { alt: b.alt, src: b.src, title: b.title } } : {}),
    sourceBlockIndex: index,
    ...(typeof b.html === "string" ? { sourceHtml: b.html } : {}),
    ...(block.type === "table" && typeof b.html === "string" ? { tableHtml: b.html } : {}),
    ...(bindings?.length ? { designTextNodeIds: bindings } : {}),
  };
}

function buildHeadingTree(blocks: Block[]) {
  const roots: any[] = [];
  const stack: any[] = [];
  blocks.forEach((block, index) => {
    if (block.type !== "heading") return;
    const item = { id: `content-${index + 1}`, title: block.text, level: block.level, sourceBlockIndex: index, children: [] as any[] };
    while (stack.length && stack[stack.length - 1].level >= item.level) stack.pop();
    if (stack.length) stack[stack.length - 1].children.push(item);
    else roots.push(item);
    stack.push(item);
  });
  return roots;
}

function collectTokens(index: DesignIndex) {
  const colors = new Map<string, any>();
  const typography = new Map<string, any>();
  const spacing = new Set<number>();
  const radii = new Set<string>();
  const effects = new Map<string, any>();
  for (const { node } of index.entries) {
    for (const paint of [...(node.fills ?? []), ...(node.strokes ?? [])]) {
      colors.set(JSON.stringify(paint), { sourceNodeId: node.id, sourceNodeName: node.name, paint });
    }
    if (node.style) typography.set(JSON.stringify(node.style), { sourceNodeId: node.id, sourceNodeName: node.name, style: node.style });
    for (const v of [node.itemSpacing, node.paddingLeft, node.paddingRight, node.paddingTop, node.paddingBottom]) {
      if (typeof v === "number" && Number.isFinite(v)) spacing.add(v);
    }
    if (node.cornerRadius !== null && node.cornerRadius !== undefined) radii.add(JSON.stringify(node.cornerRadius));
    for (const effect of node.effects ?? []) effects.set(JSON.stringify(effect), { sourceNodeId: node.id, sourceNodeName: node.name, effect });
  }
  return {
    colors: [...colors.values()], typography: [...typography.values()],
    spacing: [...spacing].sort((a, b) => a - b), radii: [...radii].map((v) => JSON.parse(v)), effects: [...effects.values()],
  };
}

/** Outermost full-width, non-page-sized ancestor-or-self: the section "band" that owns backgrounds. */
function bandOf(entry: Entry, index: DesignIndex): Entry {
  const vw = index.root.bounds?.width ?? 1;
  const vh = index.root.bounds?.height ?? 1;
  let band: Entry = entry;
  for (let e: Entry | null = entry; e && e.parent; e = e.parent) {
    const b = e.node.bounds;
    if (b && b.width >= vw * 0.9 && b.height < vh * 0.85) band = e;
  }
  return band;
}

function ignorePredicate(patterns: string[] | undefined) {
  const tests = (patterns ?? []).map((p) => {
    const m = p.match(/^\/(.+)\/([a-z]*)$/);
    return m ? (title: string) => new RegExp(m[1]!, m[2]).test(title) : (title: string) => normHeading(title) === normHeading(p);
  });
  return (title: string) => tests.some((t) => t(title));
}

export function buildBlueprint(input: BuildInput): Blueprint {
  const config = input.config ?? {};
  const content = NormalizedContentSchema.parse(input.content);
  const design = NormalizedDesignSchema.parse(input.design);
  const blocks = content.blocks as Block[];
  const minConfidence = config.minConfidence ?? 0.6;

  const designSourceUrl: string | null = (design.source as any).sourceUrl ?? config.figmaUrl ?? null;
  const { fileKey, nodeId: figmaNodeId } = parseFigmaUrl(designSourceUrl);

  // ---- viewports (one per top-level page frame)
  const root = design.document as DNode;
  const viewports = detectViewports(root);
  const primary = pickPrimary(viewports);
  if (!primary) throw new Error("No page-sized Figma frame (>= 280x400) found under any canvas. Check that figma-response.json is a full file response and the design is not empty.");
  const indexes = new Map(viewports.map((v) => [v, buildIndex(v.node)] as const));

  const groups = groupContent(blocks as ContentBlock[]);
  const overrides = new Map(Object.entries(config.sectionOverrides ?? {}).map(([k, v]) => [normHeading(k) || k, v]));
  const matchOptions = {
    overrides,
    ignore: ignorePredicate(config.ignoreSections),
    nonVisualPattern: config.nonVisualPattern ? new RegExp(config.nonVisualPattern, "i") : DEFAULT_NON_VISUAL,
    minConfidence,
  };
  const matchesByViewport = new Map(viewports.map((v) => [v, matchSections(groups, blocks as ContentBlock[], indexes.get(v)!, matchOptions)] as const));

  const sectionIds = groups.map((g, i) => `${String(i + 1).padStart(2, "0")}-${slugify(normHeading(g.title) || g.title)}`);
  const primaryIndex = primary ? indexes.get(primary)! : null;
  const primaryMatches: SectionMatch[] = primary ? matchesByViewport.get(primary)! : [];

  // ---- assets
  const sectionOf = (entry: Entry, breakpoint: Breakpoint): string | null => {
    const vp = viewports.find((v) => v.breakpoint === breakpoint && isWithin(entry, indexes.get(v)!.byId.get(v.node.id ?? "")!));
    if (!vp) return null;
    const matches = matchesByViewport.get(vp)!;
    const index = indexes.get(vp)!;
    let bestIdx = -1;
    matches.forEach((m, i) => {
      if (m.status === "matched" && m.entry && isWithin(entry, m.entry) &&
        (bestIdx < 0 || area(m.entry.node) < area(matches[bestIdx]!.entry!.node))) bestIdx = i;
    });
    if (bestIdx < 0) {
      matches.forEach((m, i) => {
        if (bestIdx < 0 && m.status === "matched" && m.entry && isWithin(entry, bandOf(m.entry, index))) bestIdx = i;
      });
    }
    return bestIdx < 0 ? null : sectionIds[bestIdx]!;
  };
  const assets = collectAssets(
    viewports.map((v) => ({ breakpoint: v.breakpoint, index: indexes.get(v)! })),
    {
      fileKey, iconMaxSize: config.iconMaxSize ?? 96, assetsDir: input.assetsDir,
      basePath: config.assets?.basePath ?? "/assets", assetMap: config.assets?.map ?? {}, sectionOf,
    },
  );

  // ---- sections
  const sections = groups.map((group, i) => {
    const match = primaryMatches[i]!;
    const bindings = match.blockBindings;
    const blockIndexes = group.blockIndexes;
    const band = match.entry && primaryIndex ? bandOf(match.entry, primaryIndex) : null;
    const responsive: Record<string, any> = {};
    for (const vp of viewports) {
      if (vp === primary) continue;
      const m = matchesByViewport.get(vp)![i]!;
      responsive[`${vp.breakpoint}${viewports.filter((v) => v.breakpoint === vp.breakpoint).length > 1 ? `:${vp.nodeId}` : ""}`] = {
        viewportNodeId: vp.nodeId, status: m.status, designNodeId: m.entry?.node.id ?? null,
        designNodeName: m.entry?.node.name ?? null, designBounds: m.entry?.node.bounds ?? null, confidence: m.confidence,
      };
    }
    const notes = [...match.notes];
    if (match.status === "unmatched") notes.push("No confident Figma container match; pin one in blueprint config `sectionOverrides` or review the alternatives.");
    return {
      id: sectionIds[i]!,
      title: group.title,
      kind: match.status === "non-visual" ? "meta" as const : "section" as const,
      hierarchyLevel: group.level,
      parentId: group.parentIndex === null ? null : sectionIds[group.parentIndex]!,
      childIds: group.childIndexes.map((c) => sectionIds[c]!),
      parentTitles: group.parentTitles,
      order: i,
      contentBlockIds: blockIndexes.map((b) => `content-${b + 1}`),
      content: blockIndexes.map((b) => contentItem(blocks[b]!, b, bindings[b])),
      designNodeId: match.entry?.node.id ?? null,
      designNodeName: match.entry?.node.name ?? null,
      designMatch: {
        status: match.status, method: match.method, confidence: match.confidence,
        coverage: match.coverage, precision: match.precision, reason: match.reason,
        innerNodeId: match.innerEntry?.node.id ?? null, childNodeIds: match.childNodeIds,
        alternatives: match.alternatives, contentNotInDesign: match.contentNotInDesign,
      },
      designBounds: match.entry?.node.bounds ?? null,
      designBand: band ? { nodeId: band.node.id, name: band.node.name, bounds: band.node.bounds } : null,
      designSubtree: config.embedSubtrees ? match.entry?.node ?? null : null,
      responsive,
      implementationNotes: notes,
    };
  });

  // ---- validation
  const errors: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];
  if (!blocks.length) errors.push("DOCX parser produced no content blocks.");
  if (!viewports.length || !primary) errors.push("No page-sized Figma frame (>= 280x400) was found; check the Figma response.");

  const visual = sections.filter((s) => s.kind === "section");
  const unmatched = visual.filter((s) => s.designMatch.status === "unmatched");
  const lowConfidence = visual.filter((s) => s.designMatch.status === "matched" && s.designMatch.confidence < minConfidence);
  if (unmatched.length) warnings.push(`No design container found for: ${unmatched.map((s) => `"${s.title}"`).join(", ")}.`);
  if (lowConfidence.length) warnings.push(`Low-confidence mapping (< ${minConfidence}) for: ${lowConfidence.map((s) => `"${s.title}" (${s.designMatch.confidence})`).join(", ")}.`);

  // Two sections may share a frame only if they own different children of it.
  const byNode = new Map<string, typeof visual>();
  for (const s of visual) if (s.designNodeId && s.designMatch.method !== "children-union") byNode.set(s.designNodeId, [...(byNode.get(s.designNodeId) ?? []), s]);
  const conflicts: string[] = [];
  for (const [nodeId, list] of byNode) {
    for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) {
      const A = new Set(list[a]!.designMatch.childNodeIds);
      const overlap = !A.size || !list[b]!.designMatch.childNodeIds.length || list[b]!.designMatch.childNodeIds.some((id) => A.has(id));
      if (overlap) conflicts.push(`"${list[a]!.title}" and "${list[b]!.title}" both map to ${nodeId}`);
    }
  }
  if (conflicts.length) warnings.push(`Sections share a design frame without separate content slices: ${conflicts.join("; ")}.`);

  // Reading order in the document should follow vertical order in the design (top-level sections).
  const top = visual.filter((s) => s.parentId === null && s.designBounds);
  const outOfOrder = top.filter((s, i) => i > 0 && s.designBounds!.y < top[i - 1]!.designBounds!.y - 50);
  if (outOfOrder.length) warnings.push(`Sections appear in a different order in the design than in the DOCX: ${outOfOrder.map((s) => `"${s.title}"`).join(", ")}.`);

  const meta = sections.filter((s) => s.kind === "meta");
  if (meta.length) info.push(`${meta.length} non-visual section(s) skipped for mapping: ${meta.map((s) => `"${s.title}"`).join(", ")}.`);
  const notInDesign = visual.reduce((n, s) => n + s.designMatch.contentNotInDesign.length, 0);
  if (notInDesign) info.push(`${notInDesign} content fragment(s) are not present as text in the design (icons, or copy missing from Figma); see designMatch.contentNotInDesign per section.`);

  const present = new Set(viewports.map((v) => v.breakpoint));
  const required = config.requiredBreakpoints ?? ["desktop"];
  const missingBp = required.filter((bp) => !present.has(bp));
  if (missingBp.length) warnings.push(`Required breakpoint design(s) missing: ${missingBp.join(", ")}.`);
  const optionalMissing = (["desktop", "mobile"] as Breakpoint[]).filter((bp) => !present.has(bp) && !required.includes(bp));
  if (optionalMissing.length) info.push(`No ${optionalMissing.join("/")} frame in this Figma file; set config.requiredBreakpoints to enforce it.`);

  if (!designSourceUrl) warnings.push("Figma source URL is missing; pass --figma-url, set BDMG_FIGMA_URL, or put figmaUrl in the config.");
  if (blocks.some((b) => b.type === "table" && (!(b as any).html || !(b as any).cells))) warnings.push("One or more DOCX tables lack structured cell metadata or source HTML; inspect table fidelity.");
  if (blocks.some((b) => b.type === "image" && !(b as any).src)) warnings.push("At least one DOCX image has no source; supply the image through the assets folder.");

  const pending = assets.filter((a) => a.status === "pending");
  const images = assets.filter((a) => a.kind === "image");
  if (assets.length) {
    const summary = `${assets.length} distinct asset(s) used by the design (${images.length} image, ${assets.length - images.length} icon); ${assets.length - pending.length} provided, ${pending.length} pending from the content team.`;
    if (pending.length && config.requireAssets) warnings.push(`${summary} Assets are required before generation.`);
    else info.push(summary);
  }

  const mapped = visual.filter((s) => s.designMatch.status === "matched" && s.designMatch.confidence >= minConfidence);
  const blueprint = {
    schemaVersion: "3.0.0",
    project: config.project ?? ((design.source as any).fileName as string | null) ?? "Landing Page",
    framework: config.framework ?? "nextjs",
    source: {
      contentFile: input.contentFile, designFile: input.designFile,
      contentFilename: content.source.filename, designFilename: design.source.filename,
      designSourceUrl, figmaFileKey: fileKey, figmaNodeId,
    },
    content: { schemaVersion: content.schemaVersion, blocks: blocks.map((b, i) => contentItem(b, i)), headingTree: buildHeadingTree(blocks) },
    design: {
      schemaVersion: design.schemaVersion,
      source: design.source,
      canvas: {
        bounds: primary?.node.bounds ?? null,
        inferredViewport: primary ? { width: primary.width, height: primary.height } : null,
        viewports: viewports.map((v) => ({ breakpoint: v.breakpoint, nodeId: v.nodeId, name: v.name, width: v.width, height: v.height, primary: v === primary })),
        responsiveEvidence: viewports.map((v) => `${v.nodeId ?? "unknown"}: ${v.name} (${v.breakpoint}, ${v.width}x${v.height})`),
      },
      tokens: primaryIndex ? collectTokens(primaryIndex) : { colors: [], typography: [], spacing: [], radii: [], effects: [] },
      document: design.document,
    },
    sections,
    assets,
    validation: {
      status: errors.length === 0 && warnings.length === 0 ? "valid" as const : "needs-review" as const,
      errors, warnings, info,
      checks: [
        { name: "normalized DOCX schema", passed: true, details: `${blocks.length} content blocks parsed.` },
        { name: "normalized Figma schema", passed: true, details: `${primaryIndex?.entries.length ?? 0} design nodes in the primary viewport.` },
        { name: "section mapping", passed: unmatched.length === 0 && lowConfidence.length === 0, details: `${mapped.length}/${visual.length} visual sections mapped at confidence >= ${minConfidence}; ${meta.length} non-visual section(s) skipped.` },
        { name: "no frame conflicts", passed: conflicts.length === 0, details: conflicts.length ? conflicts.join("; ") : "Every shared frame is split into separate content slices." },
        { name: "reading order", passed: outOfOrder.length === 0, details: outOfOrder.length ? "Design order differs from DOCX order." : "DOCX section order matches top-to-bottom design order." },
        { name: "breakpoints", passed: missingBp.length === 0, details: `Present: ${[...present].join(", ") || "none"}; required: ${required.join(", ")}.` },
        { name: "asset inventory", passed: assets.length > 0 || images.length === 0, details: `${assets.length} assets inventoried; ${pending.length} awaiting delivery. Pending assets do not block the blueprint${config.requireAssets ? " (config.requireAssets is on)" : ""}.` },
        { name: "table semantics", passed: blocks.every((b) => b.type !== "table" || Boolean((b as any).html)), details: `${blocks.filter((b) => b.type === "table").length} tables; source HTML retained.` },
        { name: "source traceability", passed: Boolean(designSourceUrl), details: designSourceUrl ? "Figma source URL is recorded." : "Figma source URL is missing." },
      ],
    },
  };
  return BlueprintSchema.parse(blueprint);
}
