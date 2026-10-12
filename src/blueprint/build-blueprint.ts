import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

/**
 * Builds a renderer-oriented blueprint from normalized DOCX + Figma JSON.
 *
 * Important design choice: the complete normalized Figma tree is embedded under
 * `design.document`. Section mappings are conveniences, not the sole copy of
 * design information. This preserves every normalized node and sourceNode
 * property for downstream generation.
 */

const ContentBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("heading"), level: z.number(), text: z.string(), html: z.string().optional() }).passthrough(),
  z.object({ type: z.literal("paragraph"), text: z.string(), html: z.string().optional(), links: z.array(z.object({ text: z.string(), href: z.string() })).optional() }).passthrough(),
  z.object({ type: z.literal("list"), ordered: z.boolean(), items: z.array(z.string()), html: z.string().optional() }).passthrough(),
  z.object({ type: z.literal("table"), rows: z.array(z.array(z.string())), cells: z.array(z.array(z.object({ text: z.string(), html: z.string().optional(), header: z.boolean().optional(), colSpan: z.number().optional(), rowSpan: z.number().optional() }))).optional(), html: z.string().optional() }).passthrough(),
  z.object({ type: z.literal("image"), alt: z.string(), src: z.string().nullable(), title: z.string().nullable() }).passthrough(),
]);

const NormalizedContentSchema = z.object({
  schemaVersion: z.string(),
  source: z.object({ filename: z.string(), parser: z.string() }).passthrough(),
  blocks: z.array(ContentBlockSchema),
}).passthrough();

const DesignNodeSchema: z.ZodType<any> = z.lazy(() => z.object({
  id: z.string().nullable(),
  name: z.string(),
  type: z.string(),
  text: z.string().nullable(),
  bounds: z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() }).nullable(),
  children: z.array(DesignNodeSchema),
}).passthrough());

const NormalizedDesignSchema = z.object({
  schemaVersion: z.string(),
  source: z.object({
    filename: z.string(),
    format: z.string(),
    fileName: z.string().nullable().optional(),
    lastModified: z.string().nullable().optional(),
  }).passthrough(),
  document: DesignNodeSchema,
}).passthrough();

const ContentItemSchema = z.object({
  id: z.string(),
  type: z.enum(["heading", "paragraph", "list", "table", "image"]),
  text: z.string().optional(),
  level: z.number().optional(),
  ordered: z.boolean().optional(),
  items: z.array(z.string()).optional(),
  rows: z.array(z.array(z.string())).optional(),
  cells: z.array(z.array(z.object({ text: z.string(), html: z.string().optional(), header: z.boolean().optional(), colSpan: z.number().optional(), rowSpan: z.number().optional() }))).optional(),
  links: z.array(z.object({ text: z.string(), href: z.string() })).optional(),
  image: z.object({ alt: z.string(), src: z.string().nullable(), title: z.string().nullable() }).optional(),
  sourceBlockIndex: z.number(),
}).passthrough();

const BlueprintSchema = z.object({
  schemaVersion: z.string(),
  project: z.string(),
  framework: z.string(),
  source: z.object({
    contentFile: z.string(),
    designFile: z.string(),
    contentFilename: z.string(),
    designFilename: z.string(),
    designSourceUrl: z.string().nullable(),
  }),
  content: z.object({
    schemaVersion: z.string(),
    blocks: z.array(ContentItemSchema),
    headingTree: z.array(z.any()),
  }),
  design: z.object({
    schemaVersion: z.string(),
    source: z.record(z.string(), z.any()),
    canvas: z.object({
      bounds: z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() }).nullable(),
      inferredViewport: z.object({ width: z.number(), height: z.number() }).nullable(),
      responsiveEvidence: z.array(z.string()),
    }),
    tokens: z.object({
      colors: z.array(z.any()),
      typography: z.array(z.any()),
      spacing: z.array(z.any()),
      radii: z.array(z.any()),
      effects: z.array(z.any()),
    }),
    document: DesignNodeSchema,
  }),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    hierarchyLevel: z.number(),
    parentTitles: z.array(z.string()).default([]),
    order: z.number(),
    contentBlockIds: z.array(z.string()),
    content: z.array(z.any()),
    mappingRequired: z.boolean(),
    designNodeId: z.string().nullable(),
    designNodeName: z.string().nullable(),
    designMatch: z.object({
      method: z.enum(["semantic-name", "text-overlap", "geometry-order", "unmatched"]),
      confidence: z.number().min(0).max(1),
      reason: z.string(),
      alternatives: z.array(z.object({ nodeId: z.string().nullable(), nodeName: z.string(), score: z.number() })),
    }),
    designBounds: z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() }).nullable(),
    designSubtree: z.any().nullable(),
    implementationNotes: z.array(z.string()),
  })),
  assets: z.array(z.any()),
  validation: z.object({
    status: z.enum(["valid", "needs-review"]),
    errors: z.array(z.string()),
    warnings: z.array(z.string()),
    checks: z.array(z.object({ name: z.string(), passed: z.boolean(), details: z.string() })),
  }),
}).strict();

type Block = z.infer<typeof ContentBlockSchema>;
type Node = {
  id: string | null;
  name: string;
  type: string;
  text: string | null;
  bounds: { x: number; y: number; width: number; height: number } | null;
  children: Node[];
  [key: string]: any;
};

function slugify(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
}
function norm(value: string): string {
  // Remove editorial numbering so "2. Site pricing" can match a Figma label
  // such as "Site Pricing" without any project-specific aliases.
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/^\s*(?:(?:section|part)\s+)?\d+(?:\.\d+)*[.)\-:]?\s*/, "")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

function flattenNodes(node: Node, ancestors: Node[] = []): Array<{ node: Node; ancestors: Node[] }> {
  return [{ node, ancestors }, ...node.children.flatMap((child) => flattenNodes(child, [...ancestors, node]))];
}
function textForBlock(block: Block): string[] {
  if ("text" in block && typeof block.text === "string" && block.text.trim()) return [block.text.trim()];
  if (block.type === "list") return block.items;
  if (block.type === "table") {
    // Prefer structured cell text (and retain cell HTML in the blueprint) over
    // flattened row strings when the parser has supplied it.
    if (block.cells?.length) return block.cells.map((row) => row.map((cell) => cell.text).join(" | "));
    return block.rows.map((row) => row.join(" | "));
  }
  if (block.type === "image") return [block.alt ? `[Image: ${block.alt}]` : "[Image]"];
  return [];
}
function contentItem(block: Block, index: number) {
  return {
    id: `content-${index + 1}`,
    type: block.type,
    ...("text" in block ? { text: block.text } : {}),
    ...("level" in block ? { level: block.level } : {}),
    ...("ordered" in block ? { ordered: block.ordered, items: block.items } : {}),
    ...("rows" in block ? { rows: block.rows } : {}),
    ...(block.type === "table" && block.cells ? { cells: block.cells } : {}),
    ...("links" in block && block.links ? { links: block.links } : {}),
    ...(block.type === "image" ? { image: { alt: block.alt, src: block.src, title: block.title } } : {}),
    sourceBlockIndex: index,
    // Preserve parser HTML for every supported block. For tables this retains
    // cell-level breaks/markup that a plain rows[][] representation can lose.
    ...("html" in block && typeof block.html === "string" ? { sourceHtml: block.html } : {}),
    ...(block.type === "table" && typeof block.html === "string" ? { tableHtml: block.html } : {}),
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
type ContentGroup = {
  title: string;
  level: number;
  start: number;
  end: number;
  blockIndexes: number[];
  parentTitles: string[];
};

function groupContent(blocks: Block[]): ContentGroup[] {
  const groups: ContentGroup[] = [];
  const headingStack: Array<{ title: string; level: number }> = [];
  let current: ContentGroup | undefined;

  blocks.forEach((block, index) => {
    if (block.type === "heading") {
      while (headingStack.length && headingStack[headingStack.length - 1].level >= block.level) {
        headingStack.pop();
      }
      const parentTitles = headingStack.map((heading) => heading.title);
      current = {
        title: block.text,
        level: block.level,
        start: index,
        end: blocks.length,
        blockIndexes: [index],
        parentTitles,
      };
      groups.push(current);
      headingStack.push({ title: block.text, level: block.level });
    } else {
      if (!current) {
        current = {
          title: "General content",
          level: 1,
          start: 0,
          end: blocks.length,
          blockIndexes: [],
          parentTitles: [],
        };
        groups.push(current);
      }
      current.blockIndexes.push(index);
    }
  });

  groups.forEach((group, index) => {
    group.end = groups[index + 1]?.start ?? blocks.length;
  });
  return groups;
}
function nodeOwnText(node: Node): string {
  return [node.name, node.text ?? ""].filter(Boolean).join(" ");
}
function similarity(a: string, b: string): number {
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  // Avoid treating a short token such as "nav" or "faq" as a near-exact match
  // merely because it appears inside a much longer, unrelated heading.
  const lengthRatio = Math.min(na.length, nb.length) / Math.max(na.length, nb.length);
  if (Math.min(na.length, nb.length) >= 5 && lengthRatio >= 0.7 && (na.includes(nb) || nb.includes(na))) return 0.94;
  const aa = new Set(na.split(/\s+/).filter((t) => t.length > 2));
  const bb = new Set(nb.split(/\s+/).filter((t) => t.length > 2));
  if (!aa.size || !bb.size) return 0;
  let intersection = 0;
  for (const token of aa) if (bb.has(token)) intersection++;
  const dice = (2 * intersection) / (aa.size + bb.size);
  const coverage = intersection / aa.size;
  return Math.max(dice, coverage * 0.82);
}

function area(node: Node): number {
  return node.bounds ? Math.max(0, node.bounds.width) * Math.max(0, node.bounds.height) : 0;
}
function tokenSet(value: string): Set<string> {
  return new Set(norm(value).split(/\s+/).filter((token) => token.length > 2));
}

function tokenCoverage(query: string, candidate: string): number {
  const queryTokens = tokenSet(query);
  const candidateTokens = tokenSet(candidate);
  if (!queryTokens.size || !candidateTokens.size) return 0;
  let matched = 0;
  for (const token of queryTokens) if (candidateTokens.has(token)) matched++;
  return matched / queryTokens.size;
}

function isEditorialOnlyGroup(title: string, groupIndex: number, blocks: Block[], group: ContentGroup): boolean {
  // Introductory material before the first page section is retained as content,
  // but should not be forced into an unrelated visual container.
  const normalized = norm(title);
  const editorialTerms = new Set(["general content", "source and overview", "project overview", "content source", "source notes", "metadata", "document notes"]);
  if (groupIndex === 0 && title === "General content") return true;
  const firstRenderableHeading = blocks.findIndex((block) => block.type === "heading" &&
    !/^(source and overview|project overview|content source|source notes|metadata|document notes)$/i.test(norm(block.text)));
  const groupStartIsBeforeRenderable = firstRenderableHeading >= 0 && group.start < firstRenderableHeading;
  return groupStartIsBeforeRenderable && editorialTerms.has(normalized);
}

function matchingEvidenceBlocks(groupIndex: number, groups: ContentGroup[], blocks: Block[]): Block[] {
  const group = groups[groupIndex];
  // A parent heading can describe a region composed of nested subsections. Its
  // matching evidence extends to the next heading at the same or higher level,
  // not merely to the next heading (which may be a child heading).
  const nextBoundary = groups.slice(groupIndex + 1).find((candidate) => candidate.level <= group.level);
  const evidenceEnd = nextBoundary?.start ?? blocks.length;
  const indexes = new Set<number>();
  for (let i = group.start; i < evidenceEnd; i++) indexes.add(i);
  return [...indexes].sort((a, b) => a - b).map((index) => blocks[index]).filter(Boolean);
}

function findSectionMatch(
  title: string,
  groupIndex: number,
  groupsCount: number,
  hierarchyLevel: number,
  entries: Array<{ node: Node; ancestors: Node[] }>,
  sectionBlocks: Block[] = [],
  parentTitles: string[] = [],
  usedNodeIds: Set<string> = new Set<string>(),
) {
  const containers = entries.filter(({ node }) =>
    node.bounds &&
    ["FRAME", "COMPONENT", "INSTANCE", "SECTION", "GROUP", "CANVAS"].includes(node.type.toUpperCase()) &&
    area(node) > 0
  );
  const contentText = sectionBlocks.flatMap(textForBlock).join(" ").slice(0, 12000);
  const pageTop = Math.min(...entries.map(({ node }) => node.bounds?.y ?? 0));
  const pageBottom = Math.max(1, ...entries.map(({ node }) => node.bounds ? node.bounds.y + node.bounds.height : 0));
  const pageHeight = Math.max(1, pageBottom - pageTop);
  const pageWidth = Math.max(1, ...entries.map(({ node }) => node.bounds?.width ?? 0));

  const scored = containers.map(({ node, ancestors }) => {
    // Keep true tree depth and ancestry. A flattened-list index is not depth.
    const descendantEntries = flattenNodes(node);
    const descendants = descendantEntries.map(({ node: descendant }) => descendant);
    const namedDescendants = descendants.filter((descendant) => descendant.name && norm(descendant.name));
    const textDescendants = descendants.filter((descendant) => descendant.text && norm(descendant.text));
    const semantic = similarity(title, node.name);
    const descendantNameScore = Math.max(0, ...namedDescendants.map((descendant) => similarity(title, descendant.name)));
    const descendantTextScore = Math.max(0, ...textDescendants.map((descendant) => similarity(title, descendant.text ?? "")));
    const contentAnchors = sectionBlocks.flatMap(textForBlock)
      .map((value) => value.trim())
      .filter((value) => value.length >= 4 && value.length <= 100)
      .slice(0, 12);
    const titleEvidence = Math.max(semantic, descendantNameScore, descendantTextScore);
    const exactAnchorDepths = descendantEntries
      .filter(({ node: descendant }) => Math.max(similarity(title, descendant.name ?? ""), similarity(title, descendant.text ?? "")) >= 0.72)
      .map(({ ancestors: innerAncestors }) => innerAncestors.length);
    const nearestAnchorDepth = exactAnchorDepths.length ? Math.min(...exactAnchorDepths) : Infinity;

    // Score meaningful content snippets individually. Aggregating an entire large
    // subtree makes unrelated frames appear relevant merely because they contain
    // lots of text. Ignore generic labels and long table-like text for this signal.
    const snippets = [
      ...namedDescendants.map((item) => item.name),
      ...textDescendants.map((item) => item.text ?? ""),
    ].filter((value) => value.length <= 240);
    const subtreeText = descendants.map((descendant) => `${descendant.name ?? ""} ${descendant.text ?? ""}`).join(" ");
    const contentSnippets = sectionBlocks.flatMap(textForBlock)
      .map((value) => value.trim())
      .filter((value) => value.length >= 8 && value.length <= 240)
      .slice(0, 40);
    const snippetCoverageScores = contentSnippets.map((snippet) => tokenCoverage(snippet, subtreeText)).sort((a, b) => b - a);
    // Average the best few snippets instead of taking only the single best one.
    // This rewards a container that covers a section's range of content and
    // prevents one repeated word (for example "Resources") from winning alone.
    const topSnippetScores = snippetCoverageScores.slice(0, Math.min(12, snippetCoverageScores.length));
    const topSnippetAverage = topSnippetScores.length
      ? topSnippetScores.reduce((sum, value) => sum + value, 0) / topSnippetScores.length
      : 0;
    // Whole-section token coverage is especially useful when the heading is
    // editorial (e.g. "Feature comparison") but the table/body copy is present
    // in Figma. Snippet averaging remains as a second, more local signal.
    const wholeSectionCoverage = contentText ? tokenCoverage(contentText, subtreeText) : 0;
    const contentEvidenceRaw = Math.max(topSnippetAverage, wholeSectionCoverage);
    // Text-only evidence is noisy in long pages and repeated footer/navigation
    // labels. It is useful only when the candidate actually covers a meaningful
    // portion of at least one section-specific snippet.
    const meaningfulContentEvidence = contentSnippets.some((snippet) => {
      const queryTokens = tokenSet(snippet);
      const candidateTokens = tokenSet(subtreeText);
      let hits = 0;
      for (const token of queryTokens) if (candidateTokens.has(token)) hits++;
      return hits >= 2 && hits / Math.max(1, queryTokens.size) >= 0.42;
    });
    const contentEvidence = meaningfulContentEvidence ? contentEvidenceRaw : 0;
    // Prefer a container close to the matching title node, rather than a giant
    // ancestor that happens to contain the same descendant text.
    const anchorDepth = nearestAnchorDepth;
    const proximityScore = Number.isFinite(anchorDepth) ? 1 / (1 + anchorDepth) : 0;
    const candidateAreaRatio = Math.sqrt(Math.min(1, area(node) / Math.max(1, pageWidth * pageHeight)));
    // Among containers with comparable evidence, prefer the smallest container
    // that still contains the relevant copy. Broad ancestors often repeat the
    // same descendant text but are not the section's actual design container.
    const hierarchySizeScore = 1 - candidateAreaRatio;
    const ancestorNames = ancestors.map((ancestor) => ancestor.name).join(" ");
    const parentText = parentTitles.join(" ");
    const hierarchyEvidence = parentTitles.length
      ? Math.max(similarity(parentText, ancestorNames), similarity(parentTitles[parentTitles.length - 1], ancestorNames))
      : 0;

    const centerY = node.bounds ? node.bounds.y + node.bounds.height / 2 : pageTop;
    const normalizedY = (centerY - pageTop) / pageHeight;
    const expectedY = (groupIndex + 0.5) / Math.max(1, groupsCount);
    const positionScore = 1 - Math.min(1, Math.abs(normalizedY - expectedY));
    const isPageLike = node.type.toUpperCase() === "CANVAS" || (node.bounds!.height > pageHeight * 0.85 && node.bounds!.width > 700);
    const pagePenalty = isPageLike ? 0.18 : 0;
    // Reuse can be correct when multiple copy headings live in one Figma frame.
    // Keep only a tiny tie-break penalty; never force a broader unrelated frame.
    const reusePenalty = node.id && usedNodeIds.has(node.id) ? 0.01 : 0;

    // Title/descendant evidence dominates; content and geometry only break ties.
    const score = Math.max(0, Math.min(1, titleEvidence >= 0.45
      ? titleEvidence * 0.58 + proximityScore * 0.14 + hierarchySizeScore * 0.10 + contentEvidence * 0.18 + hierarchyEvidence * 0.02 + positionScore * 0.02 - pagePenalty - reusePenalty
      : contentEvidence * 0.62 + hierarchySizeScore * 0.15 + positionScore * 0.12 + hierarchyEvidence * 0.11 - pagePenalty - reusePenalty
    ));
    return { node, ancestors, score, semantic, descendantNameScore, descendantTextScore, contentEvidence, hierarchyEvidence, positionScore, proximityScore, hierarchySizeScore, isPageLike };
  }).sort((a, b) => b.score - a.score || area(a.node) - area(b.node));

  // A parent and its own child are not independent competing hypotheses.
  // When both contain the same evidence, prefer the smallest suitable container.
  const isAncestorOf = (ancestorId: string | null, descendantId: string | null): boolean => {
    if (!ancestorId || !descendantId || ancestorId === descendantId) return false;
    const descendant = entries.find(({ node }) => node.id === descendantId);
    return Boolean(descendant?.ancestors.some((ancestor) => ancestor.id === ancestorId));
  };
  const best = scored[0];
  const independentAlternatives = best
    ? scored.filter((candidate) => candidate.node.id !== best.node.id &&
      !candidate.isPageLike &&
      !isAncestorOf(best.node.id, candidate.node.id) &&
      !isAncestorOf(candidate.node.id, best.node.id))
    : [];
  const second = independentAlternatives[0];
  const margin = best ? best.score - (second?.score ?? 0) : 0;
  const hasSemanticEvidence = best && (best.semantic >= 0.55 || best.descendantNameScore >= 0.62 || best.descendantTextScore >= 0.62 || best.contentEvidence >= 0.32);
  if (!best || best.score < 0.48 || !hasSemanticEvidence || (best.score < 0.64 && margin < 0.035)) {
    return {
      node: null as Node | null,
      method: "unmatched" as const,
      confidence: 0,
      reason: !best ? "No eligible design container was found." :
        `No safe match: best=${best.score.toFixed(3)}, margin=${margin.toFixed(3)}. Review the listed candidates rather than guessing.`,
      alternatives: scored.filter((candidate) => !candidate.isPageLike).slice(0, 5).map((candidate) => ({
        nodeId: candidate.node.id, nodeName: candidate.node.name, score: Number(candidate.score.toFixed(3)),
      })),
    };
  }

  const confidence = Number(Math.max(0, Math.min(1, best.score * (margin < 0.035 ? 0.9 : 1))).toFixed(3));
  const method = best.semantic >= 0.75 ? "semantic-name" as const :
    Math.max(best.descendantNameScore, best.descendantTextScore, best.contentEvidence, best.hierarchyEvidence) >= 0.52
      ? "text-overlap" as const : "geometry-order" as const;
  return {
    node: best.node,
    method,
    confidence,
    reason: `Matched using ${method}; own-name=${best.semantic.toFixed(2)}, descendant-name=${best.descendantNameScore.toFixed(2)}, descendant-text=${best.descendantTextScore.toFixed(2)}, proximity=${best.proximityScore.toFixed(2)}, content=${best.contentEvidence.toFixed(2)}, hierarchy=${best.hierarchyEvidence.toFixed(2)}, order=${best.positionScore.toFixed(2)}, margin=${margin.toFixed(2)}.`,
    alternatives: scored.filter((candidate) => candidate.node.id !== best.node.id && !candidate.isPageLike).slice(0, 5).map((candidate) => ({
      nodeId: candidate.node.id, nodeName: candidate.node.name, score: Number(candidate.score.toFixed(3)),
    })),
  };
}

function collectTokens(root: Node) {
  const entries = flattenNodes(root);
  const colors = new Map<string, any>();
  const typography = new Map<string, any>();
  const spacing = new Set<number>();
  const radii = new Set<string>();
  const effects = new Map<string, any>();
  for (const { node } of entries) {
    for (const paint of [...(node.fills ?? []), ...(node.strokes ?? [])]) {
      const key = JSON.stringify(paint);
      colors.set(key, { sourceNodeId: node.id, sourceNodeName: node.name, paint });
    }
    if (node.style) {
      const key = JSON.stringify(node.style);
      typography.set(key, { sourceNodeId: node.id, sourceNodeName: node.name, style: node.style });
    }
    for (const value of [node.itemSpacing, node.paddingLeft, node.paddingRight, node.paddingTop, node.paddingBottom]) {
      if (typeof value === "number" && Number.isFinite(value)) spacing.add(value);
    }
    if (node.cornerRadius !== null && node.cornerRadius !== undefined) radii.add(JSON.stringify(node.cornerRadius));
    for (const effect of node.effects ?? []) effects.set(JSON.stringify(effect), { sourceNodeId: node.id, sourceNodeName: node.name, effect });
  }
  return {
    colors: [...colors.values()],
    typography: [...typography.values()],
    spacing: [...spacing].sort((a, b) => a - b),
    radii: [...radii].map((value) => JSON.parse(value)),
    effects: [...effects.values()],
  };
}
function collectAssets(root: Node) {
  const assets: any[] = [];
  for (const { node } of flattenNodes(root)) {
    const source = node.sourceNode ?? {};
    const hasImageFill = (node.fills ?? []).some((fill: any) => fill?.type === "IMAGE");
    const hasExport = Array.isArray(node.exportSettings) && node.exportSettings.length > 0;
    const hasImageRef = typeof source.imageRef === "string" || typeof source.imageHash === "string";
    if (hasImageFill || hasExport || hasImageRef || node.type === "VECTOR" || node.type === "BOOLEAN_OPERATION") {
      assets.push({
        nodeId: node.id,
        name: node.name,
        type: node.type,
        bounds: node.bounds,
        imageFills: (node.fills ?? []).filter((fill: any) => fill?.type === "IMAGE"),
        exportSettings: node.exportSettings ?? [],
        imageRef: source.imageRef ?? source.imageHash ?? null,
        resolution: hasImageFill || hasImageRef ? "unresolved-reference" : (hasExport ? "export-required" : "vector-data"),
        portableUrl: null,
        vectorNetwork: source.vectorNetwork ?? null,
        paths: source.fillGeometry ?? source.strokeGeometry ?? null,
      });
    }
  }
  return assets;
}
function canvasBounds(root: Node) {
  const nodes = flattenNodes(root).map((entry) => entry.node).filter((node) => node.bounds && node.bounds.width > 0 && node.bounds.height > 0);
  if (!nodes.length) return null;
  // Prefer a page-level/frame node over the document's aggregate bounds.
  const preferred = nodes.find((node) => ["CANVAS", "FRAME", "SECTION"].includes(node.type.toUpperCase()) && node.bounds && node.bounds.width >= 320)
    ?? nodes[0];
  return preferred.bounds;
}

async function main(): Promise<void> {
  const outputDir = path.resolve(process.argv[2] ?? "output");
  const contentPath = path.resolve(process.argv[3] ?? path.join(outputDir, "normalized-content.json"));
  const designPath = path.resolve(process.argv[4] ?? path.join(outputDir, "normalized-design.json"));
  const projectName = process.env.BDMG_PROJECT_NAME ?? path.basename(contentPath, path.extname(contentPath)).replace(/normalized-content/i, "Landing Page").trim();

  const [contentText, designText] = await Promise.all([readFile(contentPath, "utf8"), readFile(designPath, "utf8")]);
  const content = NormalizedContentSchema.parse(JSON.parse(contentText));
  const design = NormalizedDesignSchema.parse(JSON.parse(designText));
  const blocks = content.blocks as Block[];
  const entries = flattenNodes(design.document as Node);
  const groups = groupContent(blocks);
  const usedNodeIds = new Set<string>();

  const sections = groups.map((group, index) => {
    const blockIndexes = Array.from({ length: Math.max(0, group.end - group.start) }, (_, offset) => group.start + offset);
    const sectionBlocks = blockIndexes.map((blockIndex) => blocks[blockIndex]).filter(Boolean);
    const mappingRequired = !isEditorialOnlyGroup(group.title, index, blocks, group);
    const evidenceBlocks = matchingEvidenceBlocks(index, groups, blocks);
    const match = mappingRequired ? findSectionMatch(
      group.title,
      index,
      groups.length,
      group.level,
      entries,
      evidenceBlocks,
      group.parentTitles,
      usedNodeIds,
    ) : {
      node: null as Node | null,
      method: "unmatched" as const,
      confidence: 0,
      reason: "Introductory/editorial content is preserved but is not required to map to a rendered design container.",
      alternatives: [] as Array<{ nodeId: string | null; nodeName: string; score: number }>,
    };
    if (match.node?.id) usedNodeIds.add(match.node.id);
    const contentItems = sectionBlocks.map((block, localIndex) => contentItem(block, group.start + localIndex));
    const notes: string[] = [];
    if (!match.node) notes.push("No confident Figma container match; review before generation.");
    if (match.confidence > 0 && match.confidence < 0.5) notes.push("Low-confidence content-to-design mapping.");
    if (match.node && !match.node.bounds) notes.push("Matched design node has no bounds.");
    return {
      id: `${String(index + 1).padStart(2, "0")}-${slugify(group.title)}`,
      title: group.title,
      hierarchyLevel: group.level,
      parentTitles: group.parentTitles,
      order: index,
      contentBlockIds: blockIndexes.map((blockIndex) => `content-${blockIndex + 1}`),
      content: contentItems,
      mappingRequired,
      designNodeId: match.node?.id ?? null,
      designNodeName: match.node?.name ?? null,
      designMatch: {
        method: match.method,
        confidence: match.confidence,
        reason: match.reason,
        alternatives: match.alternatives,
      },
      designBounds: match.node?.bounds ?? null,
      // Complete matching subtree gives the page generator all node-level specs.
      designSubtree: match.node ?? null,
      implementationNotes: notes,
    };
  });

  const rootBounds = canvasBounds(design.document as Node);
  const responsiveEvidence = entries
    .filter(({ node }) => /mobile|tablet|desktop|breakpoint|responsive/i.test(`${node.name} ${node.type}`))
    .map(({ node }) => `${node.id ?? "unknown"}: ${node.name} (${node.type})`)
    .slice(0, 100);

  const errors: string[] = [];
  const warnings: string[] = [];
  if (!blocks.length) errors.push("DOCX parser produced no content blocks.");
  if (!entries.length) errors.push("Figma normalizer produced no design nodes.");
  if (sections.some((section) => section.mappingRequired && section.designNodeId === null)) warnings.push("One or more renderable content sections do not have a confident design-container mapping.");
  if (sections.some((section) => section.designMatch.confidence > 0 && section.designMatch.confidence < 0.5)) warnings.push("One or more section mappings have low confidence.");
  if (!responsiveEvidence.length) warnings.push("No explicit responsive/mobile/tablet evidence was found in the Figma node names. Do not assume responsive rules.");
  if (blocks.some((block) => block.type === "table" && (!block.html || !block.cells))) warnings.push("One or more DOCX tables lack structured cell metadata or source HTML; inspect table fidelity.");
  if (!(design.source.sourceUrl ?? process.env.BDMG_FIGMA_URL ?? process.env.FIGMA_SOURCE_URL)) warnings.push("Figma source URL is missing; set BDMG_FIGMA_URL or FIGMA_SOURCE_URL, or include sourceUrl in normalized-design.json.");
  const assets = collectAssets(design.document as Node);
  // Asset delivery is a later generation-stage responsibility by default. Set
  // BDMG_REQUIRE_PORTABLE_ASSETS=true when this pipeline should gate on paths.
  if (process.env.BDMG_REQUIRE_PORTABLE_ASSETS === "true" && assets.some((asset) => asset.resolution === "unresolved-reference" || asset.resolution === "export-required")) {
    warnings.push("Design assets are inventoried but not proven portable; export/download image assets and populate a manifest before generation.");
  }
  if (blocks.some((block) => block.type === "image" && !block.src)) warnings.push("At least one DOCX image has no portable source URL; resolve image assets before page generation.");
  if (sections.some((section) => section.mappingRequired && section.designMatch.confidence < 0.5)) warnings.push("Some renderable section-to-design mappings are unverified. Do not generate from these mappings without review.");

  const blueprint = {
    schemaVersion: "2.0.0",
    project: projectName || "Landing Page",
    framework: process.env.BDMG_FRAMEWORK ?? "nextjs",
    source: {
      contentFile: path.relative(process.cwd(), contentPath),
      designFile: path.relative(process.cwd(), designPath),
      contentFilename: content.source.filename,
      designFilename: design.source.filename,
      designSourceUrl: design.source.sourceUrl ?? process.env.BDMG_FIGMA_URL ?? process.env.FIGMA_SOURCE_URL ?? null,
    },
    content: {
      schemaVersion: content.schemaVersion,
      blocks: blocks.map((block, index) => contentItem(block, index)),
      headingTree: buildHeadingTree(blocks),
    },
    design: {
      schemaVersion: design.schemaVersion,
      source: design.source,
      canvas: {
        bounds: rootBounds,
        inferredViewport: rootBounds ? { width: rootBounds.width, height: rootBounds.height } : null,
        responsiveEvidence,
      },
      tokens: collectTokens(design.document as Node),
      // This is the canonical loss-preserving design tree used by the renderer.
      document: design.document,
    },
    sections,
    assets,
    validation: {
      status: errors.length === 0 && warnings.length === 0 && sections.every((section) => !section.mappingRequired || (section.designNodeId !== null && section.designMatch.confidence >= 0.5))
        ? "valid" as const
        : "needs-review" as const,
      errors,
      warnings,
      checks: [
        { name: "normalized DOCX schema", passed: true, details: `${blocks.length} content blocks parsed.` },
        { name: "normalized Figma schema", passed: true, details: `${entries.length} design nodes available.` },
        { name: "section mapping", passed: sections.every((section) => !section.mappingRequired || (section.designNodeId !== null && section.designMatch.confidence >= 0.5)), details: `${sections.filter((section) => section.mappingRequired && section.designNodeId !== null && section.designMatch.confidence >= 0.5).length}/${sections.filter((section) => section.mappingRequired).length} renderable sections have a mapping at confidence >= 0.5; editorial-only groups are preserved without requiring a design node.` },
        { name: "responsive evidence", passed: responsiveEvidence.length > 0, details: responsiveEvidence.length ? `${responsiveEvidence.length} possible responsive-related nodes found.` : "No explicit responsive evidence found." },
        { name: "asset inventory", passed: process.env.BDMG_REQUIRE_PORTABLE_ASSETS !== "true" || assets.every((asset) => asset.resolution === "vector-data" || Boolean(asset.portableUrl)), details: process.env.BDMG_REQUIRE_PORTABLE_ASSETS === "true" ? `${assets.length} asset/vector candidates recorded; ${assets.filter((asset) => Boolean(asset.portableUrl)).length} have portable URLs/paths. Portability is required by configuration.` : `${assets.length} asset/vector candidates inventoried; portability is deferred to page generation because assets may be supplied separately.` },
        { name: "table semantics", passed: blocks.every((block) => block.type !== "table" || Boolean(block.html)), details: `${blocks.filter((block) => block.type === "table").length} tables; source HTML retained where supplied to preserve cell markup and line breaks.` },
        { name: "source traceability", passed: Boolean(design.source.sourceUrl ?? process.env.BDMG_FIGMA_URL ?? process.env.FIGMA_SOURCE_URL), details: (design.source.sourceUrl ?? process.env.BDMG_FIGMA_URL ?? process.env.FIGMA_SOURCE_URL) ? "Figma source URL is recorded." : "Figma source URL is missing." },
      ],
    },
  };

  const validated = BlueprintSchema.parse(blueprint);
  await mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, "landing-page-blueprint.json");
  await writeFile(outputPath, JSON.stringify(validated, null, 2), "utf8");
  console.log(`Created ${outputPath}`);
  console.log(`Blueprint schema validation passed: ${validated.sections.length} content sections, ${entries.length} Figma nodes.`);
  console.log(`Status: ${validated.validation.status}`);
  if (validated.validation.errors.length) console.error("Errors:", validated.validation.errors);
  if (validated.validation.warnings.length) console.warn("Warnings:", validated.validation.warnings);
  if (validated.validation.status !== "valid") {
    console.warn("Blueprint is structurally valid but requires semantic mapping/asset review before generation.");
  }
}

main().catch((error: unknown) => {
  console.error("Blueprint creation or validation failed:", error);
  process.exitCode = 1;
});
