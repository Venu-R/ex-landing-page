import type {
  PlanNode,
  PlanReportItem,
  PlanStyle,
  PlanSvg,
  PlanTextRun
} from "@bdmg/types";

import {
  autoLayoutToCss,
  effectsToCss,
  fillsToBackground,
  isAutoLayout,
  num,
  px,
  radiusToCss,
  strokeShadows,
  textColor,
  textLayout,
  textTypography,
  visiblePaints,
  type ImageResolver,
  type StyleMap,
  type TextStyleInput
} from "./css.js";
import type { SkinRegistry } from "./skins.js";
import { isVisible, type DNode } from "./types.js";

export interface NodeRole {
  tag?: string;
  href?: string;
  attrs?: Record<string, string>;
}

export interface IconAsset {
  publicPath: string;
}

export interface BuildContext {
  skins: SkinRegistry;
  resolveImage: ImageResolver;
  /** Figma node id of an icon root -> delivered SVG/PNG. */
  iconAssets: Map<string, IconAsset>;
  /** Figma TEXT node id -> copy from the DOCX. */
  textOverrides: Map<string, string>;
  roles: Map<string, NodeRole>;
  fonts: Map<string, { weights: Set<number>; italic: boolean }>;
  stats: { nodes: number; skipped: number; textOverrides: number; pendingImages: number; vectorsWithoutGeometry: number };
  warnings: PlanReportItem[];
}

const VECTOR_TYPES = new Set(["VECTOR", "BOOLEAN_OPERATION", "STAR", "REGULAR_POLYGON", "POLYGON", "LINE", "ELLIPSE"]);

function hasVisual(node: DNode): boolean {
  return (
    visiblePaints(node.fills).length > 0 ||
    visiblePaints(node.strokes).length > 0 ||
    (node.effects ?? []).some((e) => e.visible !== false)
  );
}

function sizeOf(node: DNode) {
  return { width: node.bounds?.width ?? 0, height: node.bounds?.height ?? 0 };
}

// ------------------------------------------------------------------ geometry

/**
 * Position and size. Auto-layout children stay in flow (so the flex container
 * reproduces Figma's spacing); everything else is absolutely positioned from the
 * parent's top-left corner, which is exactly how Figma stores it.
 */
export function geometry(node: DNode, parent: DNode | null): PlanStyle {
  const b = node.bounds!;
  const box: PlanStyle = {};
  const inFlow =
    parent !== null &&
    isAutoLayout(parent) &&
    node.sourceNode?.layoutPositioning !== "ABSOLUTE";

  if (!inFlow) {
    box.position = "absolute";
    box.left = px(parent?.bounds ? b.x - parent.bounds.x : 0);
    box.top = px(parent?.bounds ? b.y - parent.bounds.y : 0);
    box.width = px(b.width);
    box.height = px(b.height);
    return box;
  }

  const horizontal = parent!.layoutMode === "HORIZONTAL";
  const mainSizing = horizontal ? node.layoutSizingHorizontal : node.layoutSizingVertical;
  const crossSizing = horizontal ? node.layoutSizingVertical : node.layoutSizingHorizontal;
  box.position = "relative";
  const mainProp = horizontal ? "width" : "height";
  const crossProp = horizontal ? "height" : "width";
  const mainValue = horizontal ? b.width : b.height;
  const crossValue = horizontal ? b.height : b.width;

  if (mainSizing === "FILL" || node.sourceNode?.layoutGrow === 1) {
    box.flex = "1 1 0px";
    box[horizontal ? "minWidth" : "minHeight"] = "0";
  } else {
    box.flex = "0 0 auto";
    box[mainProp] = px(mainValue);
  }
  if (crossSizing === "FILL" || node.sourceNode?.layoutAlign === "STRETCH") {
    box.alignSelf = "stretch";
  } else {
    box[crossProp] = px(crossValue);
  }
  return box;
}

// ---------------------------------------------------------------------- skin

function strokeInput(node: DNode) {
  const sn = node.sourceNode ?? {};
  return {
    strokes: node.strokes,
    strokeWeight: typeof sn.strokeWeight === "number" ? sn.strokeWeight : undefined,
    strokeAlign: typeof sn.strokeAlign === "string" ? sn.strokeAlign : undefined,
    individualStrokeWeights: sn.individualStrokeWeights
  } as Parameters<typeof strokeShadows>[0];
}

function boxSkin(node: DNode, ctx: BuildContext): StyleMap {
  const size = sizeOf(node);
  const style: StyleMap = { ...autoLayoutToCss(node) };
  Object.assign(style, fillsToBackground(node.fills, size, ctx.resolveImage));
  const fx = effectsToCss(node.effects);
  const shadows = [...strokeShadows(strokeInput(node)), ...fx.boxShadows];
  if (shadows.length) style.boxShadow = shadows.join(", ");
  Object.assign(style, fx.style);
  if (node.type === "ELLIPSE") style.borderRadius = "50%";
  else Object.assign(style, radiusToCss(node.cornerRadius, node.sourceNode?.rectangleCornerRadii));
  if (node.clipsContent && (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE")) {
    style.overflow = "hidden";
  }
  if (typeof node.opacity === "number" && node.opacity < 1) style.opacity = num(node.opacity);
  return style;
}

// ---------------------------------------------------------------------- text

function registerFont(ctx: BuildContext, style: TextStyleInput) {
  const family = style.fontFamily;
  if (!family) return;
  const entry = ctx.fonts.get(family) ?? { weights: new Set<number>(), italic: false };
  entry.weights.add(style.fontWeight ?? 400);
  if (style.italic) entry.italic = true;
  ctx.fonts.set(family, entry);
}

function textStyleInput(raw: Record<string, any> | null | undefined): TextStyleInput {
  const s = raw ?? {};
  return {
    fontFamily: s.fontFamily,
    fontWeight: s.fontWeight,
    fontSize: s.fontSize,
    italic: Boolean(s.italic),
    letterSpacing: s.letterSpacing,
    lineHeightPx: s.lineHeightPx,
    textCase: s.textCase,
    textDecoration: s.textDecoration,
    textAlignHorizontal: s.textAlignHorizontal,
    textAlignVertical: s.textAlignVertical
  };
}

function buildRuns(node: DNode, text: string, ctx: BuildContext): PlanTextRun[] | null {
  const overrides = node.characterStyleOverrides ?? [];
  const table = node.styleOverrideTable ?? {};
  if (!overrides.length || !Object.keys(table).length) return null;
  const size = sizeOf(node);
  const runs: PlanTextRun[] = [];
  const chars = [...text];
  let start = 0;
  const idAt = (i: number) => overrides[i] ?? 0;
  for (let i = 1; i <= chars.length; i++) {
    if (i === chars.length || idAt(i) !== idAt(start)) {
      const id = idAt(start);
      const piece = chars.slice(start, i).join("");
      if (id === 0 || !table[String(id)]) {
        runs.push({ text: piece });
      } else {
        const merged = textStyleInput({ ...(node.style ?? {}), ...table[String(id)] });
        registerFont(ctx, merged);
        const style: StyleMap = { ...textTypography(merged) };
        const fills = table[String(id)]?.fills as DNode["fills"];
        if (fills) Object.assign(style, textColor(fills, size));
        runs.push({ text: piece, cls: ctx.skins.add(style) });
      }
      start = i;
    }
  }
  return runs.length > 1 ? runs : null;
}

function buildText(node: DNode, parent: DNode | null, ctx: BuildContext): PlanNode | null {
  const original = (node.text ?? "").replace(/\u2028/g, "\n");
  if (!original.trim() && !original.includes("\n")) return null;
  const override = node.id ? ctx.textOverrides.get(node.id) : undefined;
  const text = override ?? original;
  if (override !== undefined && override !== original) ctx.stats.textOverrides += 1;

  const style = textStyleInput(node.style);
  registerFont(ctx, style);
  const size = sizeOf(node);
  const skin: StyleMap = {
    ...textTypography(style),
    ...textColor(node.fills, size),
    ...textLayout(style)
  };
  const fx = effectsToCss(node.effects, { text: true });
  Object.assign(skin, fx.style);
  if (typeof node.opacity === "number" && node.opacity < 1) skin.opacity = num(node.opacity);
  const lineHeight = style.lineHeightPx ?? (style.fontSize ? style.fontSize * 1.2 : 16);
  const singleLine = !text.includes("\n") && size.height < lineHeight * 1.6;
  skin.whiteSpace = singleLine ? "nowrap" : "pre-wrap";

  const role = node.id ? ctx.roles.get(node.id) : undefined;
  const runs = override === undefined ? buildRuns(node, text, ctx) : null;
  return {
    id: node.id ?? "",
    name: node.name,
    kind: "text",
    tag: role?.tag ?? "p",
    cls: ctx.skins.add(skin),
    box: geometry(node, parent),
    text: runs ?? text,
    ...(role?.href ? { href: role.href } : {}),
    ...(role?.attrs ? { attrs: role.attrs } : {})
  };
}

// ------------------------------------------------------------------- vectors

function vectorSvg(node: DNode): PlanSvg | null {
  const sn = node.sourceNode ?? {};
  const b = node.bounds!;
  const fillColor = (paints: DNode["fills"]) => {
    const p = [...visiblePaints(paints)].reverse().find((x) => x.type === "SOLID" && x.color);
    if (!p?.color) return undefined;
    const c = p.color;
    const a = (c.a ?? 1) * (p.opacity ?? 1);
    const h = (v: number | undefined) => Math.round((v ?? 0) * 255).toString(16).padStart(2, "0");
    return a >= 0.999 ? `#${h(c.r)}${h(c.g)}${h(c.b)}` : `rgba(${Math.round((c.r ?? 0) * 255)}, ${Math.round((c.g ?? 0) * 255)}, ${Math.round((c.b ?? 0) * 255)}, ${num(a)})`;
  };
  const paths: PlanSvg["paths"] = [];
  const fill = fillColor(node.fills);
  for (const g of sn.fillGeometry ?? []) {
    if (g?.path) paths.push({ d: g.path, fill: fill ?? "currentColor", fillRule: g.windingRule === "EVENODD" ? "evenodd" : "nonzero" });
  }
  const stroke = fillColor(node.strokes);
  for (const g of sn.strokeGeometry ?? []) {
    if (g?.path) paths.push({ d: g.path, fill: stroke ?? "currentColor", fillRule: g.windingRule === "EVENODD" ? "evenodd" : "nonzero" });
  }
  if (!paths.length) return null;
  return { viewBox: `0 0 ${num(b.width, 2)} ${num(b.height, 2)}`, paths };
}

// ---------------------------------------------------------------------- tree

export function buildPlanNode(node: DNode, parent: DNode | null, ctx: BuildContext): PlanNode | null {
  if (!isVisible(node) || !node.bounds || !node.id) {
    ctx.stats.skipped += 1;
    return null;
  }
  const inFlow = parent !== null && isAutoLayout(parent) && node.sourceNode?.layoutPositioning !== "ABSOLUTE";

  // Delivered icon: draw the whole icon as one image and ignore its vector children.
  const icon = ctx.iconAssets.get(node.id);
  if (icon) {
    ctx.stats.nodes += 1;
    const skin: StyleMap = {};
    if (typeof node.opacity === "number" && node.opacity < 1) skin.opacity = num(node.opacity);
    return {
      id: node.id,
      name: node.name,
      kind: "image",
      tag: "img",
      cls: ctx.skins.add({ ...skin, display: "block", objectFit: "contain" }),
      box: geometry(node, parent),
      src: icon.publicPath,
      alt: "",
      attrs: { "aria-hidden": "true" }
    };
  }

  if (node.type === "TEXT") {
    const text = buildText(node, parent, ctx);
    if (text) ctx.stats.nodes += 1;
    else ctx.stats.skipped += 1;
    return text;
  }

  if (VECTOR_TYPES.has(node.type) && node.type !== "ELLIPSE" && node.type !== "LINE") {
    const svg = vectorSvg(node);
    if (!svg) {
      ctx.stats.vectorsWithoutGeometry += 1;
      ctx.stats.skipped += 1;
      return null;
    }
    ctx.stats.nodes += 1;
    const skin: StyleMap = { display: "block", overflow: "visible" };
    if (typeof node.opacity === "number" && node.opacity < 1) skin.opacity = num(node.opacity);
    return {
      id: node.id,
      name: node.name,
      kind: "svg",
      tag: "svg",
      cls: ctx.skins.add(skin),
      box: geometry(node, parent),
      svg,
      attrs: { "aria-hidden": "true" }
    };
  }

  const children: PlanNode[] = [];
  for (const child of node.children) {
    const built = buildPlanNode(child, node, ctx);
    if (built) children.push(built);
  }

  // A LINE has no area; draw its stroke as a thin box.
  let skin = boxSkin(node, ctx);
  const box = geometry(node, parent);
  if (node.type === "LINE") {
    const weight = typeof node.sourceNode?.strokeWeight === "number" ? node.sourceNode.strokeWeight : 1;
    const color = [...visiblePaints(node.strokes)].reverse().find((p) => p.type === "SOLID");
    skin = { ...skin, ...(color ? fillsToBackground([color], sizeOf(node), ctx.resolveImage) : {}) };
    if ((node.bounds.height ?? 0) < 1) box.height = px(weight);
    if ((node.bounds.width ?? 0) < 1) box.width = px(weight);
  }

  // Skip absolutely positioned boxes that draw nothing and hold nothing.
  if (!inFlow && !children.length && !hasVisual(node)) {
    ctx.stats.skipped += 1;
    return null;
  }

  // Pending image fills leave a transparent box; flag them for the report.
  if (visiblePaints(node.fills).some((p) => p.type === "IMAGE" && !ctx.resolveImage(p.imageRef))) {
    ctx.stats.pendingImages += 1;
  }

  const role = ctx.roles.get(node.id);
  ctx.stats.nodes += 1;
  return {
    id: node.id,
    name: node.name,
    kind: "box",
    tag: role?.tag ?? "div",
    cls: ctx.skins.add(skin),
    box,
    ...(role?.href ? { href: role.href } : {}),
    ...(role?.attrs ? { attrs: role.attrs } : {}),
    ...(children.length ? { children } : {})
  };
}
