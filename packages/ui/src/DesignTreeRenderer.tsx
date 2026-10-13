
import type { CSSProperties, ReactNode } from "react";
import type { NormalizedDesignNode } from "@bdmg/types";

type RendererProps = {
  node: NormalizedDesignNode;
  parentBounds?: NormalizedDesignNode["bounds"];
};

type Paint = {
  type?: string;
  visible?: boolean;
  opacity?: number;
  color?: {
    r?: number;
    g?: number;
    b?: number;
    a?: number;
  };
  gradientStops?: Array<{
    position?: number;
    color?: {
      r?: number;
      g?: number;
      b?: number;
      a?: number;
    };
  }>;
  gradientHandlePositions?: Array<{ x: number; y: number }>;
};

type NodeWithOptionalStyles = NormalizedDesignNode & {
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  layoutAlign?: string;
  layoutGrow?: number;
  layoutPositioning?: string;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  strokes?: Paint[];
  fills?: Paint[];
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    lineHeightPx?: number;
    letterSpacing?: number;
    textAlignHorizontal?: string;
    textAlignVertical?: string;
  };
};

function rgba(
  color: NonNullable<Paint["color"]>,
  opacity = 1
): string {
  const r = Math.round((color.r ?? 0) * 255);
  const g = Math.round((color.g ?? 0) * 255);
  const b = Math.round((color.b ?? 0) * 255);
  const a = (color.a ?? 1) * opacity;

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function paintToCss(paint: Paint): string | undefined {
  if (paint.visible === false) return undefined;

  const opacity = paint.opacity ?? 1;

  if (paint.type === "SOLID" && paint.color) {
    return rgba(paint.color, opacity);
  }

  if (
    (paint.type === "GRADIENT_LINEAR" ||
      paint.type === "GRADIENT_RADIAL") &&
    paint.gradientStops?.length
  ) {
    const stops = paint.gradientStops
      .map((stop) => {
        if (!stop.color) return undefined;

        const color = rgba(stop.color, opacity);
        const position = Math.round((stop.position ?? 0) * 100);

        return `${color} ${position}%`;
      })
      .filter(Boolean)
      .join(", ");

    if (!stops) return undefined;

    return paint.type === "GRADIENT_RADIAL"
      ? `radial-gradient(circle, ${stops})`
      : `linear-gradient(135deg, ${stops})`;
  }

  return undefined;
}

function firstPaint(
  paints: Paint[] | undefined
): string | undefined {
  return paints
    ?.filter((paint) => paint.visible !== false)
    .map(paintToCss)
    .find((value) => value !== undefined);
}

function getAlignment(value?: string): CSSProperties["justifyContent"] {
  switch (value) {
    case "MIN":
      return "flex-start";
    case "CENTER":
      return "center";
    case "MAX":
      return "flex-end";
    case "SPACE_BETWEEN":
      return "space-between";
    default:
      return undefined;
  }
}

function getCrossAlignment(
  value?: string
): CSSProperties["alignItems"] {
  switch (value) {
    case "MIN":
      return "flex-start";
    case "CENTER":
      return "center";
    case "MAX":
      return "flex-end";
    case "BASELINE":
      return "baseline";
    default:
      return undefined;
  }
}

function getNodeStyles(
  node: NodeWithOptionalStyles,
  parentBounds?: NormalizedDesignNode["bounds"]
): CSSProperties {
  const bounds = node.bounds;
  const isAutoLayout = Boolean(node.layoutMode);
  const styles: CSSProperties = {
    boxSizing: "border-box",
    position: isAutoLayout ? "relative" : "absolute",
    background: firstPaint(node.fills),
    opacity: node.opacity ?? undefined,
    borderRadius:
      typeof node.cornerRadius === "number"
        ? node.cornerRadius
        : undefined,
    overflow: node.clipsContent ? "hidden" : undefined,
    border: firstPaint(node.strokes)
      ? `1px solid ${firstPaint(node.strokes)}`
      : undefined,
  };
  if (!isAutoLayout) {
  styles.position = "relative";
}

  if (bounds) {
  styles.width = bounds.width;
  styles.height = bounds.height || undefined;

  if (parentBounds) {
    styles.left = bounds.x - parentBounds.x;
    styles.top = bounds.y - parentBounds.y;
  }
}

  if (isAutoLayout) {
    styles.display = "flex";
    styles.flexDirection =
      node.layoutMode === "VERTICAL" ? "column" : "row";
    styles.flexWrap =
      node.layoutWrap === "WRAP" ? "wrap" : "nowrap";
    styles.gap = node.itemSpacing ?? 0;
    styles.paddingTop = node.paddingTop ?? 0;
    styles.paddingRight = node.paddingRight ?? 0;
    styles.paddingBottom = node.paddingBottom ?? 0;
    styles.paddingLeft = node.paddingLeft ?? 0;
    styles.justifyContent = getAlignment(node.primaryAxisAlignItems);
    styles.alignItems = getCrossAlignment(node.counterAxisAlignItems);
  }

  if (node.layoutGrow === 1) {
    styles.flexGrow = 1;
  }

  if (node.layoutAlign === "STRETCH") {
    styles.alignSelf = "stretch";
  }

  if (node.type === "TEXT" && node.style) {
    styles.fontFamily = node.style.fontFamily;
    styles.fontSize = node.style.fontSize;
    styles.fontWeight = node.style.fontWeight;
    styles.lineHeight = node.style.lineHeightPx
      ? `${node.style.lineHeightPx}px`
      : undefined;
    styles.letterSpacing = node.style.letterSpacing;
    styles.textAlign =
      node.style.textAlignHorizontal?.toLowerCase() as
        | CSSProperties["textAlign"]
        | undefined;
  }

  return styles;
}

function renderContent(
  node: NormalizedDesignNode,
  parentBounds?: NormalizedDesignNode["bounds"]
): ReactNode {
  const children = node.children ?? [];

  if (node.type === "TEXT") {
    return node.text ?? "";
  }

  return children.map((child) => (
    <DesignTreeRenderer
      key={child.id}
      node={child}
      parentBounds={
        node.layoutMode ? undefined : node.bounds
      }
    />
  ));
}

export function DesignTreeRenderer({
  node,
  parentBounds,
}: RendererProps) {
  if (node.visible === false) return null;

  // Document and canvas nodes are structural containers.
  if (node.type === "DOCUMENT" || node.type === "CANVAS") {
    return (
      <>
        {node.children?.map((child) => (
          <DesignTreeRenderer key={child.id} node={child} />
        ))}
      </>
    );
  }

  const styledNode = node as NodeWithOptionalStyles;
  const styles = getNodeStyles(styledNode, parentBounds);

  return (
    <div
      data-figma-node-id={node.id}
      data-figma-node-name={node.name}
      data-figma-node-type={node.type}
      style={styles}
    >
      {renderContent(node, parentBounds)}
    </div>
  );
}
