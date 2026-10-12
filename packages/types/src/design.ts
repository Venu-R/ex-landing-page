export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NormalizedDesignNode {
  id: string | null;
  name: string;
  type: string;
  text: string | null;
  bounds: Bounds | null;
  children: NormalizedDesignNode[];

  relativeTransform?: unknown;
  fills?: unknown[];
  strokes?: unknown[];
  effects?: unknown[];
  cornerRadius?: unknown;
  opacity?: number | null;
  visible?: boolean | null;
  locked?: boolean | null;
  clipsContent?: boolean | null;
  constraints?: unknown;
  layoutMode?: string | null;
  layoutWrap?: unknown;
  layoutSizingHorizontal?: unknown;
  layoutSizingVertical?: unknown;
  primaryAxisSizingMode?: unknown;
  counterAxisSizingMode?: unknown;
  primaryAxisAlignItems?: unknown;
  counterAxisAlignItems?: unknown;
  counterAxisAlignContent?: unknown;
  itemSpacing?: number | null;
  counterAxisSpacing?: unknown;
  paddingLeft?: unknown;
  paddingRight?: unknown;
  paddingTop?: unknown;
  paddingBottom?: unknown;
  style?: Record<string, unknown> | null;
  characterStyleOverrides?: unknown[];
  styleOverrideTable?: Record<string, unknown>;
  componentId?: unknown;
  componentProperties?: Record<string, unknown>;
  isComponent?: boolean;
  isInstance?: boolean;
  exportSettings?: unknown[];
  sourceNode?: Record<string, unknown>;

  [key: string]: unknown;
}

export interface DesignSource {
  filename: string;
  format: string;
  fileName?: string | null;
  lastModified?: string | null;
  sourceUrl?: string | null;
  [key: string]: unknown;
}

export interface NormalizedDesign {
  schemaVersion: string;
  source: DesignSource;
  document: NormalizedDesignNode;
  [key: string]: unknown;
}

export interface DesignCanvas {
  bounds: Bounds | null;
  inferredViewport: {
    width: number;
    height: number;
  } | null;
  responsiveEvidence: string[];
}

export interface DesignToken {
  sourceNodeId: string | null;
  sourceNodeName: string;
  paint?: unknown;
  style?: unknown;
  effect?: unknown;
}

export interface DesignTokens {
  colors: DesignToken[];
  typography: DesignToken[];
  spacing: number[];
  radii: unknown[];
  effects: DesignToken[];
}

export interface DesignAsset {
  nodeId: string | null;
  name: string;
  type: string;
  bounds: Bounds | null;
  imageFills: unknown[];
  exportSettings: unknown[];
  imageRef: string | null;
  resolution:
    | "unresolved-reference"
    | "export-required"
    | "vector-data";
  portableUrl: string | null;
  vectorNetwork?: unknown;
  paths?: unknown;
  [key: string]: unknown;
}