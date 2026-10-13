/**
 * Figma -> CSS conversion helpers.
 *
 * Pure functions with no I/O so they can be unit-tested. Everything operates on
 * the *normalized* Figma node (see src/normalizers/normalize-figma.ts), which
 * keeps the original REST properties under `sourceNode`.
 *
 * Conventions
 *  - Figma paint arrays are ordered bottom -> top. CSS `background` layers are
 *    ordered top -> bottom, so background layers are reversed.
 *  - Strokes never use CSS `border` (that would shift the containing block of
 *    absolutely positioned children). They are drawn with box-shadow instead.
 */

export type FigmaColor = { r?: number; g?: number; b?: number; a?: number };
export type FigmaPaint = {
  type?: string;
  visible?: boolean;
  opacity?: number;
  color?: FigmaColor;
  scaleMode?: string;
  imageRef?: string;
  gradientHandlePositions?: Array<{ x: number; y: number }>;
  gradientStops?: Array<{ position?: number; color?: FigmaColor }>;
};
export type FigmaEffect = {
  type?: string;
  visible?: boolean;
  radius?: number;
  spread?: number;
  color?: FigmaColor;
  offset?: { x: number; y: number };
};
export type Size = { width: number; height: number };

export type StyleMap = Record<string, string>;

/** 12.3456 -> "12.35px", 0 -> "0" */
export function px(value: number): string {
  if (!Number.isFinite(value) || Math.abs(value) < 0.005) return "0";
  return `${Number(value.toFixed(2))}px`;
}

export function num(value: number, digits = 3): string {
  return String(Number(value.toFixed(digits)));
}

const channel = (v: number | undefined) => Math.round(Math.min(1, Math.max(0, v ?? 0)) * 255);

export function rgba(color: FigmaColor, opacity = 1): string {
  const r = channel(color.r);
  const g = channel(color.g);
  const b = channel(color.b);
  const a = Math.min(1, Math.max(0, (color.a ?? 1) * opacity));
  if (a >= 0.999) {
    return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
  }
  return `rgba(${r}, ${g}, ${b}, ${num(a)})`;
}

export const visiblePaints = (paints: FigmaPaint[] | undefined): FigmaPaint[] =>
  (paints ?? []).filter((p) => p && p.visible !== false);

// ------------------------------------------------------------------ gradients

/**
 * Figma linear gradients are defined by two handle points in the node's
 * normalised (0..1) box. CSS gradients use an angle plus a gradient line whose
 * length depends on the box. Stops are converted so both render identically,
 * including gradients whose handles lie outside the box.
 */
export function linearGradient(paint: FigmaPaint, size: Size): string | undefined {
  const handles = paint.gradientHandlePositions;
  const stops = paint.gradientStops;
  if (!handles || handles.length < 2 || !stops?.length) return undefined;
  const w = Math.max(size.width, 0.0001);
  const h = Math.max(size.height, 0.0001);
  const p0 = { x: handles[0]!.x * w, y: handles[0]!.y * h };
  const p1 = { x: handles[1]!.x * w, y: handles[1]!.y * h };
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const len = Math.hypot(dx, dy);
  if (len < 0.0001) return undefined;
  const ux = dx / len;
  const uy = dy / len;
  const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
  // CSS gradient line length for this angle, centred on the box.
  const lineLength = Math.abs(w * ux) + Math.abs(h * uy);
  const start = { x: w / 2 - (ux * lineLength) / 2, y: h / 2 - (uy * lineLength) / 2 };
  const offset = (p0.x - start.x) * ux + (p0.y - start.y) * uy;
  const opacity = paint.opacity ?? 1;
  const list = stops
    .map((stop) => {
      const t = stop.position ?? 0;
      const position = ((offset + t * len) / lineLength) * 100;
      return `${rgba(stop.color ?? {}, opacity)} ${num(position, 2)}%`;
    })
    .join(", ");
  return `linear-gradient(${num(angle, 2)}deg, ${list})`;
}

export function radialGradient(paint: FigmaPaint, size: Size): string | undefined {
  const handles = paint.gradientHandlePositions;
  const stops = paint.gradientStops;
  if (!handles || handles.length < 3 || !stops?.length) return undefined;
  const w = size.width;
  const h = size.height;
  const c = handles[0]!;
  const rx = Math.hypot((handles[1]!.x - c.x) * w, (handles[1]!.y - c.y) * h);
  const ry = Math.hypot((handles[2]!.x - c.x) * w, (handles[2]!.y - c.y) * h);
  const opacity = paint.opacity ?? 1;
  const list = stops
    .map((s) => `${rgba(s.color ?? {}, opacity)} ${num((s.position ?? 0) * 100, 2)}%`)
    .join(", ");
  return `radial-gradient(ellipse ${num(rx, 1)}px ${num(ry, 1)}px at ${num(c.x * w, 1)}px ${num(c.y * h, 1)}px, ${list})`;
}

// ---------------------------------------------------------------- backgrounds

export type ImageResolver = (imageRef: string | undefined) => string | null;

/**
 * Convert a node's fills to CSS background declarations.
 * Returns {} when the node has no visible fills.
 */
export function fillsToBackground(
  fills: FigmaPaint[] | undefined,
  size: Size,
  resolveImage: ImageResolver,
): StyleMap {
  const layers: Array<{ image: string; size?: string; repeat?: string; position?: string }> = [];
  for (const paint of visiblePaints(fills)) {
    if (paint.type === "SOLID" && paint.color) {
      const c = rgba(paint.color, paint.opacity ?? 1);
      layers.push({ image: `linear-gradient(${c}, ${c})` });
    } else if (paint.type === "GRADIENT_LINEAR") {
      const g = linearGradient(paint, size);
      if (g) layers.push({ image: g });
    } else if (paint.type === "GRADIENT_RADIAL" || paint.type === "GRADIENT_DIAMOND") {
      const g = radialGradient(paint, size);
      if (g) layers.push({ image: g });
    } else if (paint.type === "IMAGE") {
      const url = resolveImage(paint.imageRef);
      if (!url) continue;
      const mode = paint.scaleMode ?? "FILL";
      layers.push({
        image: `url("${url}")`,
        size: mode === "FILL" ? "cover" : mode === "FIT" ? "contain" : mode === "TILE" ? "auto" : "100% 100%",
        repeat: mode === "TILE" ? "repeat" : "no-repeat",
        position: "center",
      });
    }
  }
  if (!layers.length) return {};
  // A single plain solid fill is the common case: keep the CSS readable.
  const only = layers.length === 1 ? visiblePaints(fills)[0] : undefined;
  if (only?.type === "SOLID" && only.color) {
    return { backgroundColor: rgba(only.color, only.opacity ?? 1) };
  }
  const top = [...layers].reverse();
  const out: StyleMap = { backgroundImage: top.map((l) => l.image).join(", ") };
  if (top.some((l) => l.size)) out.backgroundSize = top.map((l) => l.size ?? "auto").join(", ");
  if (top.some((l) => l.repeat)) out.backgroundRepeat = top.map((l) => l.repeat ?? "no-repeat").join(", ");
  if (top.some((l) => l.position)) out.backgroundPosition = top.map((l) => l.position ?? "0 0").join(", ");
  return out;
}

// -------------------------------------------------------------------- strokes

export type StrokeInput = {
  strokes?: FigmaPaint[];
  strokeWeight?: number;
  strokeAlign?: string; // INSIDE | OUTSIDE | CENTER
  individualStrokeWeights?: { top: number; right: number; bottom: number; left: number };
};

/** Strokes expressed as box-shadow layers (they never affect layout). */
export function strokeShadows(input: StrokeInput): string[] {
  const paint = [...visiblePaints(input.strokes)].reverse().find((p) => p.type === "SOLID" && p.color);
  if (!paint?.color) return [];
  const color = rgba(paint.color, paint.opacity ?? 1);
  const ind = input.individualStrokeWeights;
  if (ind) {
    const out: string[] = [];
    if (ind.top) out.push(`inset 0 ${px(ind.top)} 0 0 ${color}`);
    if (ind.right) out.push(`inset ${px(-ind.right)} 0 0 0 ${color}`);
    if (ind.bottom) out.push(`inset 0 ${px(-ind.bottom)} 0 0 ${color}`);
    if (ind.left) out.push(`inset ${px(ind.left)} 0 0 0 ${color}`);
    return out;
  }
  const weight = input.strokeWeight ?? 1;
  if (!weight) return [];
  switch (input.strokeAlign) {
    case "OUTSIDE":
      return [`0 0 0 ${px(weight)} ${color}`];
    case "CENTER":
      return [`0 0 0 ${px(weight / 2)} ${color}`, `inset 0 0 0 ${px(weight / 2)} ${color}`];
    default:
      return [`inset 0 0 0 ${px(weight)} ${color}`];
  }
}

// -------------------------------------------------------------------- effects

export type EffectCss = {
  /** box-shadow layers (drop + inner shadows), top-most first */
  boxShadows: string[];
  /** filter / backdrop-filter / text-shadow */
  style: StyleMap;
};

export function effectsToCss(
  effects: FigmaEffect[] | undefined,
  options: { text?: boolean } = {},
): EffectCss {
  const boxShadows: string[] = [];
  const textShadows: string[] = [];
  const style: StyleMap = {};
  for (const e of effects ?? []) {
    if (!e || e.visible === false) continue;
    const color = rgba(e.color ?? {}, 1);
    const x = e.offset?.x ?? 0;
    const y = e.offset?.y ?? 0;
    const blur = e.radius ?? 0;
    if (e.type === "DROP_SHADOW") {
      if (options.text) textShadows.push(`${px(x)} ${px(y)} ${px(blur)} ${color}`);
      else boxShadows.push(`${px(x)} ${px(y)} ${px(blur)} ${px(e.spread ?? 0)} ${color}`);
    } else if (e.type === "INNER_SHADOW" && !options.text) {
      boxShadows.push(`inset ${px(x)} ${px(y)} ${px(blur)} ${px(e.spread ?? 0)} ${color}`);
    } else if (e.type === "LAYER_BLUR") {
      style.filter = `blur(${px(blur / 2)})`;
    } else if (e.type === "BACKGROUND_BLUR") {
      style.backdropFilter = `blur(${px(blur / 2)})`;
      style.WebkitBackdropFilter = `blur(${px(blur / 2)})`;
    }
  }
  if (textShadows.length) style.textShadow = textShadows.join(", ");
  return { boxShadows, style };
}

// --------------------------------------------------------------------- radius

export function radiusToCss(cornerRadius: unknown, radii: unknown): StyleMap {
  if (Array.isArray(radii) && radii.length === 4 && radii.every((v) => typeof v === "number")) {
    const [tl, tr, br, bl] = radii as number[];
    if (tl === tr && tr === br && br === bl) return tl ? { borderRadius: px(tl!) } : {};
    return { borderRadius: `${px(tl!)} ${px(tr!)} ${px(br!)} ${px(bl!)}` };
  }
  if (typeof cornerRadius === "number" && cornerRadius > 0) {
    // Figma allows radii larger than half the box; CSS clamps the same way.
    return { borderRadius: px(cornerRadius) };
  }
  return {};
}

// ----------------------------------------------------------------------- text

export type TextStyleInput = {
  fontFamily?: string;
  fontWeight?: number;
  fontSize?: number;
  italic?: boolean;
  letterSpacing?: number;
  lineHeightPx?: number;
  lineHeightUnit?: string;
  lineHeightPercentFontSize?: number;
  textCase?: string;
  textDecoration?: string;
  textAlignHorizontal?: string;
  textAlignVertical?: string;
};

export function fontFamilyCss(family: string | undefined): string | undefined {
  if (!family) return undefined;
  const clean = family.replace(/["';{}\\]/g, "").trim();
  if (!clean) return undefined;
  const generic = /mono|code|courier/i.test(clean)
    ? "ui-monospace, monospace"
    : /serif/i.test(clean) && !/sans/i.test(clean)
      ? "Georgia, serif"
      : "system-ui, -apple-system, 'Segoe UI', Arial, sans-serif";
  return `"${clean}", ${generic}`;
}

/** Typography only (no colour): shared by whole-node and per-run styles. */
export function textTypography(style: TextStyleInput): StyleMap {
  const out: StyleMap = {};
  const family = fontFamilyCss(style.fontFamily);
  if (family) out.fontFamily = family;
  if (style.fontSize) out.fontSize = px(style.fontSize);
  out.fontWeight = String(style.fontWeight ?? 400);
  if (style.italic) out.fontStyle = "italic";
  if (style.lineHeightPx) out.lineHeight = px(style.lineHeightPx);
  else out.lineHeight = "normal";
  out.letterSpacing = style.letterSpacing ? px(style.letterSpacing) : "0";
  switch (style.textCase) {
    case "UPPER":
      out.textTransform = "uppercase";
      break;
    case "LOWER":
      out.textTransform = "lowercase";
      break;
    case "TITLE":
      out.textTransform = "capitalize";
      break;
    case "SMALL_CAPS":
      out.fontVariantCaps = "small-caps";
      break;
    default:
      break;
  }
  if (style.textDecoration === "UNDERLINE") out.textDecoration = "underline";
  else if (style.textDecoration === "STRIKETHROUGH") out.textDecoration = "line-through";
  return out;
}

export function textColor(fills: FigmaPaint[] | undefined, size: Size): StyleMap {
  // Text uses the top-most visible fill.
  const paint = [...visiblePaints(fills)].reverse()[0];
  if (!paint) return {};
  if (paint.type === "SOLID" && paint.color) return { color: rgba(paint.color, paint.opacity ?? 1) };
  const gradient =
    paint.type === "GRADIENT_LINEAR" ? linearGradient(paint, size) : radialGradient(paint, size);
  if (gradient) {
    return {
      backgroundImage: gradient,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      WebkitTextFillColor: "transparent",
      color: "transparent",
    };
  }
  return {};
}

export function textLayout(style: TextStyleInput): StyleMap {
  const out: StyleMap = {};
  const align = style.textAlignHorizontal;
  out.textAlign = align === "CENTER" ? "center" : align === "RIGHT" ? "right" : align === "JUSTIFIED" ? "justify" : "left";
  const v = style.textAlignVertical;
  if (v === "CENTER" || v === "BOTTOM") {
    out.display = "flex";
    out.flexDirection = "column";
    out.justifyContent = v === "CENTER" ? "center" : "flex-end";
  }
  return out;
}

// ------------------------------------------------------------ auto layout / box

export type AutoLayoutInput = {
  layoutMode?: string | null;
  layoutWrap?: string | null;
  primaryAxisAlignItems?: string | null;
  counterAxisAlignItems?: string | null;
  itemSpacing?: number | null;
  counterAxisSpacing?: number | null;
  paddingLeft?: number | null;
  paddingRight?: number | null;
  paddingTop?: number | null;
  paddingBottom?: number | null;
};

const JUSTIFY: Record<string, string> = {
  MIN: "flex-start",
  CENTER: "center",
  MAX: "flex-end",
  SPACE_BETWEEN: "space-between",
};
const ALIGN: Record<string, string> = {
  MIN: "flex-start",
  CENTER: "center",
  MAX: "flex-end",
  BASELINE: "baseline",
};

export function isAutoLayout(node: { layoutMode?: string | null }): boolean {
  return node.layoutMode === "HORIZONTAL" || node.layoutMode === "VERTICAL";
}

export function autoLayoutToCss(node: AutoLayoutInput): StyleMap {
  if (!isAutoLayout(node)) return {};
  const primary = node.primaryAxisAlignItems ?? "MIN";
  const out: StyleMap = {
    display: "flex",
    flexDirection: node.layoutMode === "VERTICAL" ? "column" : "row",
    justifyContent: JUSTIFY[primary] ?? "flex-start",
    alignItems: ALIGN[node.counterAxisAlignItems ?? "MIN"] ?? "flex-start",
  };
  // With SPACE_BETWEEN Figma ignores itemSpacing; CSS gap would act as a minimum.
  const gap = primary === "SPACE_BETWEEN" ? 0 : (node.itemSpacing ?? 0);
  if (gap) out.columnGap = out.rowGap = px(gap);
  if (node.layoutWrap === "WRAP") {
    out.flexWrap = "wrap";
    out.alignContent = "flex-start";
    if (node.counterAxisSpacing != null) {
      if (node.layoutMode === "VERTICAL") out.columnGap = px(node.counterAxisSpacing);
      else out.rowGap = px(node.counterAxisSpacing);
    }
  }
  const t = node.paddingTop ?? 0;
  const r = node.paddingRight ?? 0;
  const b = node.paddingBottom ?? 0;
  const l = node.paddingLeft ?? 0;
  if (t || r || b || l) out.padding = `${px(t)} ${px(r)} ${px(b)} ${px(l)}`;
  return out;
}
