import type { ContentBlock, ParsedDocx } from "./docx.js";

export interface ContentSection {
  id: string;
  title: string;
  level: number;
  blocks: ContentBlock[];
}

export interface SiteContent {
  title: string;
  description: string;
  figmaUrl: string | null;
  sections: ContentSection[];
  blocks: ContentBlock[];
  links?: Array<{ text: string; href: string; source: "docx" }>;
  assets?: Array<{ alt: string; src: string | null; title: string | null; source: "docx" }>;
}

export interface FigmaEvidence {
  source: "figma-mcp" | "figma-api-json";
  fileKey: string;
  nodeId: string | null;
  capturedAt: string;
  sections: Array<{
    nodeId: string;
    name: string;
    width?: number;
    height?: number;
    text?: string[];
    styles?: Record<string, string>;
    assets?: Array<{ name: string; url: string; type: "image" | "svg" | "render" }>;
  }>;
  responsiveFrames: Array<{ nodeId: string; name: string; width?: number; height?: number }>;
  screenshots?: Array<{ name: string; path?: string; width?: number; height?: number }>;
}

export interface ReconciliationIssue {
  type: "missing-content" | "conflict" | "unavailable-asset" | "unresolved-link" | "unverified-design";
  message: string;
  source?: string;
  severity: "info" | "warning" | "error";
}

export interface Reconciliation {
  issues: ReconciliationIssue[];
  matchedSections: Array<{ contentSectionId: string; figmaNodeId: string | null; confidence: "high" | "medium" | "low" }>;
}

export interface DesignSpecification {
  source: "figma-mcp" | "figma-api-json" | "unverified";
  fileKey: string | null;
  rootNodeId: string | null;
  sections: Array<{
    contentSectionId: string;
    figmaNodeId: string | null;
    name: string;
    order: number;
    dimensions: { width: number | null; height: number | null };
    typography: Record<string, string>;
    colors: Record<string, string>;
    assets: Array<{ name: string; url: string; type: "image" | "svg" | "render" }>;
    confidence: "high" | "medium" | "low";
    geometrySource: "measured" | "inferred" | "unavailable";
  }>;
  responsiveFrames: Array<{ nodeId: string; name: string; width: number | null; height: number | null }>;
  unresolvedIssues: string[];
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72) || "section";
}

function stripNumbering(value: string): string {
  return value.replace(/^\s*\d+(?:\.\d+)*[.)-]?\s*/, "").trim();
}

export function buildSiteContent(parsed: ParsedDocx): SiteContent {
  const sections: ContentSection[] = [];
  let current: ContentSection | null = null;

  for (const block of parsed.blocks) {
    if (block.type === "heading" && block.level <= 1) {
      const title = stripNumbering(block.text);
      current = {
        id: `${String(sections.length + 1).padStart(2, "0")}-${slug(title)}`,
        title,
        level: block.level,
        blocks: [block],
      };
      sections.push(current);
    } else if (current) {
      current.blocks.push(block);
    } else {
      current = {
        id: "00-overview",
        title: "Overview",
        level: 1,
        blocks: [block],
      };
      sections.push(current);
    }
  }

  const textBlocks = parsed.blocks.filter((block): block is Extract<ContentBlock, { text: string }> =>
    "text" in block && Boolean(block.text.trim()),
  );
  const title =
    parsed.blocks.find((block): block is Extract<ContentBlock, { type: "heading" }> =>
      block.type === "heading" && block.level <= 1)?.text ??
    textBlocks[0]?.text ??
    "Generated Landing Page";
  const description =
    textBlocks.find((block) => block.text.length > 60 && !/^figma:/i.test(block.text))?.text ??
    "Generated from DOCX content and Figma design context.";
  const figmaText = textBlocks.find((block) => /https:\/\/www\.figma\.com\//i.test(block.text))?.text ?? "";
  const figmaUrl = figmaText.match(/https:\/\/www\.figma\.com\/\S+/i)?.[0] ?? null;

  const links = parsed.blocks.flatMap((block) => block.type === "paragraph"
    ? (block.links ?? []).map((link) => ({ ...link, source: "docx" as const }))
    : []);
  const assets = parsed.blocks.flatMap((block) => block.type === "image" ? [{ ...block, source: "docx" as const }] : []);
  return { title: stripNumbering(title), description, figmaUrl, sections, blocks: parsed.blocks, links, assets };
}

export function reconcileContentAndDesign(content: SiteContent, evidence?: FigmaEvidence): Reconciliation {
  if (!evidence) {
    return {
      issues: [{ type: "unverified-design", severity: "warning", message: "No Figma MCP evidence supplied; layout, styles, assets, and responsive behavior remain unverified." }],
      matchedSections: content.sections.map((section) => ({ contentSectionId: section.id, figmaNodeId: null, confidence: "low" })),
    };
  }

  const issues: ReconciliationIssue[] = [];
  const matchedSections = content.sections.map((section) => {
    const match = evidence.sections.find((candidate) => candidate.name.toLowerCase() === section.title.toLowerCase())
      ?? evidence.sections.find((candidate) => candidate.name.toLowerCase().includes(section.title.toLowerCase()) || section.title.toLowerCase().includes(candidate.name.toLowerCase()));
    if (!match) {
      issues.push({ type: "missing-content", severity: "warning", message: `No matching Figma section was identified for "${section.title}".`, source: section.id });
      return { contentSectionId: section.id, figmaNodeId: null, confidence: "low" as const };
    }
    const designText = new Set((match.text ?? []).map((value) => value.trim().toLowerCase()));
    for (const block of section.blocks) {
      if (!("text" in block) || !block.text.trim()) continue;
      const sourceText = block.text.trim().toLowerCase();
      if (designText.size && /[$€£]|\d/.test(block.text) && !designText.has(sourceText)) {
        issues.push({ type: "conflict", severity: "warning", message: `Content value "${block.text}" was not an exact match in Figma section "${match.name}".`, source: section.id });
      }
    }
    return { contentSectionId: section.id, figmaNodeId: match.nodeId, confidence: "medium" as const };
  });
  for (const asset of evidence.sections.flatMap((section) => section.assets ?? [])) {
    if (!asset.url.trim()) issues.push({ type: "unavailable-asset", severity: "warning", message: `Figma asset "${asset.name}" has no retrievable URL.` });
  }
  for (const link of content.links ?? []) {
    if (!/^https?:\/\/|^#/.test(link.href)) {
      issues.push({ type: "unresolved-link", severity: "warning", message: `Link "${link.text}" has an unresolved destination.`, source: link.href });
    }
  }
  return { issues, matchedSections };
}

export function buildDesignSpecification(
  content: SiteContent,
  evidence: FigmaEvidence | undefined,
  reconciliation: Reconciliation,
): DesignSpecification {
  if (!evidence) {
    return {
      source: "unverified",
      fileKey: null,
      rootNodeId: null,
      sections: content.sections.map((section, order) => ({
        contentSectionId: section.id,
        figmaNodeId: null,
        name: section.title,
        order,
        dimensions: { width: null, height: null },
        typography: {},
        colors: {},
        assets: [],
        confidence: "low",
        geometrySource: "unavailable",
      })),
      responsiveFrames: [],
      unresolvedIssues: reconciliation.issues.map((issue) => issue.message),
    };
  }

  return {
    source: "figma-mcp",
    fileKey: evidence.fileKey,
    rootNodeId: evidence.nodeId,
    sections: reconciliation.matchedSections.map((match, order) => {
      const section = evidence.sections.find((candidate) => candidate.nodeId === match.figmaNodeId);
      return {
        contentSectionId: match.contentSectionId,
        figmaNodeId: match.figmaNodeId,
        name: section?.name ?? match.contentSectionId,
        order,
        dimensions: { width: section?.width ?? null, height: section?.height ?? null },
        typography: section?.styles && Object.fromEntries(
          Object.entries(section.styles).filter(([key]) => /font|text|line|letter/i.test(key)),
        ) || {},
        colors: section?.styles && Object.fromEntries(
          Object.entries(section.styles).filter(([key]) => /color|background|fill|border/i.test(key)),
        ) || {},
        assets: section?.assets ?? [],
        confidence: match.confidence,
        geometrySource: section?.width !== undefined || section?.height !== undefined ? "measured" : "unavailable",
      };
    }),
    responsiveFrames: evidence.responsiveFrames.map((frame) => ({
      nodeId: frame.nodeId,
      name: frame.name,
      width: frame.width ?? null,
      height: frame.height ?? null,
    })),
    unresolvedIssues: reconciliation.issues.map((issue) => issue.message),
  };
}

export function tableRows(section: ContentSection): string[][] {
  return section.blocks.flatMap((block) => (block.type === "table" ? block.rows : []));
}

export function listItems(section: ContentSection): string[] {
  return section.blocks.flatMap((block) => (block.type === "list" ? block.items : []));
}

export function paragraphs(section: ContentSection): string[] {
  return section.blocks.flatMap((block) => (block.type === "paragraph" ? [block.text] : []));
}
