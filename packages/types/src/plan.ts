/**
 * Page plan: the renderer-ready description of a landing page.
 *
 * The generator turns a blueprint (content + Figma tree + mappings + assets)
 * into this plan. The UI package renders it 1:1 without knowing anything about
 * Figma. Everything the renderer needs (geometry, tag, class, text, asset URL)
 * is already resolved here.
 */

/** Inline CSS declarations, camelCase keys, values already carry units ("12px"). */
export type PlanStyle = Record<string, string>;

export interface PlanTextRun {
  text: string;
  /** Skin class applied to the run (only present for mixed-style text). */
  cls?: string;
}

export interface PlanSvgPath {
  d: string;
  fill?: string;
  fillRule?: "nonzero" | "evenodd";
}

export interface PlanSvg {
  viewBox: string;
  paths: PlanSvgPath[];
}

export type PlanNodeKind = "box" | "text" | "image" | "svg";

export interface PlanNode {
  /** Figma node id, written to `data-figma-id` for traceability and testing. */
  id: string;
  name: string;
  kind: PlanNodeKind;
  tag: string;
  /** Class(es) from the generated design.css (colours, type, borders, shadows). */
  cls?: string;
  /** Geometry that is unique to this node (position, size, flex). Inline. */
  box: PlanStyle;
  text?: string | PlanTextRun[];
  /** Image URL for kind "image". */
  src?: string;
  alt?: string;
  href?: string;
  svg?: PlanSvg;
  /** Extra HTML attributes (aria-*, data-*, role). */
  attrs?: Record<string, string>;
  children?: PlanNode[];
}

export type PlanBandRole = "header" | "section" | "footer" | "loose";

/** A full-width horizontal band of the page (nav, hero, pricing, footer, ...). */
export interface PlanBand {
  id: string;
  name: string;
  role: PlanBandRole;
  /** Blueprint section ids whose copy lives in this band. */
  sectionIds: string[];
  /** Accessible label (first matching blueprint section title). */
  label: string | null;
  top: number;
  height: number;
  /** Stacking order taken from the Figma layer order. */
  zIndex: number;
  /** Solid colour that should bleed to the edges of wide screens. */
  bleedBackground?: string;
  root: PlanNode;
}

export interface PlanViewport {
  breakpoint: "desktop" | "tablet" | "mobile";
  nodeId: string | null;
  designWidth: number;
  designHeight: number;
  /** CSS media query bounds (px) in which this viewport is shown. */
  minWidth: number | null;
  maxWidth: number | null;
  /** Colour behind all bands. */
  background?: string;
  bands: PlanBand[];
}

export interface PlanFont {
  family: string;
  weights: number[];
  italic: boolean;
}

export interface PlanAssetRef {
  id: string;
  expectedName: string;
  kind: "image" | "icon";
  status: "provided" | "pending";
  publicPath: string | null;
  width: number;
  height: number;
}

export interface PlanReportItem {
  code: string;
  message: string;
  nodeId?: string | null;
  sectionId?: string | null;
}

export interface PagePlan {
  schemaVersion: "1.0.0";
  project: string;
  generatedAt: string;
  source: {
    blueprintSchema: string;
    figmaFileKey: string | null;
    figmaUrl: string | null;
  };
  fonts: PlanFont[];
  viewports: PlanViewport[];
  assets: PlanAssetRef[];
  report: {
    nodes: number;
    skippedNodes: number;
    textOverrides: number;
    warnings: PlanReportItem[];
    info: PlanReportItem[];
  };
}
