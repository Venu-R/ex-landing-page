import type { FigmaEffect, FigmaPaint } from "./css.js";

export type Bounds = { x: number; y: number; width: number; height: number };

/** Normalized Figma node (see src/normalizers/normalize-figma.ts). */
export interface DNode {
  id: string | null;
  name: string;
  type: string;
  text: string | null;
  bounds: Bounds | null;
  visible?: boolean | null;
  fills?: FigmaPaint[];
  strokes?: FigmaPaint[];
  effects?: FigmaEffect[];
  cornerRadius?: number | null;
  opacity?: number | null;
  clipsContent?: boolean | null;
  layoutMode?: string | null;
  layoutWrap?: string | null;
  layoutSizingHorizontal?: string | null;
  layoutSizingVertical?: string | null;
  primaryAxisAlignItems?: string | null;
  counterAxisAlignItems?: string | null;
  itemSpacing?: number | null;
  counterAxisSpacing?: number | null;
  paddingLeft?: number | null;
  paddingRight?: number | null;
  paddingTop?: number | null;
  paddingBottom?: number | null;
  style?: Record<string, any> | null;
  characterStyleOverrides?: number[];
  styleOverrideTable?: Record<string, Record<string, any>>;
  sourceNode?: Record<string, any>;
  children: DNode[];
  [key: string]: any;
}

export const isVisible = (node: DNode): boolean => node.visible !== false;

export function findNode(root: DNode, id: string): DNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

export function walk(node: DNode, visit: (node: DNode, parent: DNode | null) => void, parent: DNode | null = null): void {
  visit(node, parent);
  for (const child of node.children) if (isVisible(child)) walk(child, visit, node);
}

export function textLeaves(node: DNode): DNode[] {
  const out: DNode[] = [];
  walk(node, (n) => {
    if (n.type === "TEXT" && n.text) out.push(n);
  });
  return out;
}
