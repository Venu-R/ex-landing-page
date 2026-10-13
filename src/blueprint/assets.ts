import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { CONTAINER_TYPES, type Breakpoint, type DesignIndex, type DNode, type Entry } from "./design-index";
import { slugify } from "./text";

/**
 * Asset manifest.
 *
 * Figma's file response never contains image bytes (only an `imageRef` hash) and
 * only contains vector geometry when requested with `geometry=paths`. So the
 * blueprint does not pretend assets are resolved. It records every distinct
 * image / icon the design uses, where it is used, and the file name the content
 * team should deliver. If an assets folder is supplied, files are matched by
 * name and each asset is marked `provided` or `pending`.
 */

export type AssetUsage = {
  nodeId: string | null;
  nodeName: string;
  breakpoint: Breakpoint;
  role: "background" | "content" | "icon";
  sectionId: string | null;
  bounds: { x: number; y: number; width: number; height: number } | null;
  contextText: string | null;
};

export type AssetEntry = {
  id: string;
  kind: "image" | "icon";
  /** File name (without extension) the content team should deliver. */
  expectedName: string;
  acceptedExtensions: string[];
  width: number;
  height: number;
  imageRef: string | null;
  usages: AssetUsage[];
  status: "provided" | "pending";
  /** Public URL path of the delivered file, once found. */
  publicPath: string | null;
  figmaExport: { fileKey: string | null; nodeIds: string[]; format: "svg" | "png"; note: string };
  aliases: string[];
};

export type AssetOptions = {
  fileKey: string | null;
  iconMaxSize: number;
  assetsDir?: string | undefined;
  basePath: string;
  assetMap: Record<string, string>;
  sectionOf: (entry: Entry, breakpoint: Breakpoint) => string | null;
};

const VECTOR_LEAF = new Set(["VECTOR", "BOOLEAN_OPERATION", "LINE", "ELLIPSE", "STAR", "REGULAR_POLYGON", "POLYGON"]);

function leaves(node: DNode): DNode[] {
  const kids = node.children.filter((c) => c.visible !== false);
  return kids.length ? kids.flatMap(leaves) : [node];
}
const hasText = (node: DNode): boolean => node.type === "TEXT" || node.children.some((c) => c.visible !== false && hasText(c));
const hasImageFill = (node: DNode): boolean => (node.fills ?? []).some((f: any) => f?.type === "IMAGE" && f.visible !== false);

function isIconRoot(node: DNode, maxSize: number): boolean {
  if (!node.bounds || Math.max(node.bounds.width, node.bounds.height) > maxSize) return false;
  if (node.type !== "VECTOR" && node.type !== "BOOLEAN_OPERATION" && !CONTAINER_TYPES.has(node.type)) return false;
  if (hasText(node)) return false;
  const l = leaves(node);
  return l.length > 0 && l.every((leaf) => VECTOR_LEAF.has(leaf.type) && !hasImageFill(leaf));
}

const r1 = (n: number) => Math.round(n * 10) / 10;
function iconSignature(node: DNode): string {
  const b = node.bounds!;
  const parts = leaves(node).map((leaf) => {
    const lb = leaf.bounds;
    const paint = JSON.stringify([...(leaf.fills ?? []), ...(leaf.strokes ?? [])].map((p: any) => [p.type, p.color && [r1(p.color.r * 255), r1(p.color.g * 255), r1(p.color.b * 255)], p.opacity]));
    return `${leaf.type}:${lb ? `${r1(lb.x - b.x)},${r1(lb.y - b.y)},${r1(lb.width)},${r1(lb.height)}` : "?"}:${paint}`;
  });
  return `${r1(b.width)}x${r1(b.height)}|${parts.join(";")}`;
}

function nearbyText(entry: Entry): string | null {
  for (let e: Entry | null = entry.parent; e; e = e.parent) {
    const t = e.node.children.find((c) => c.type === "TEXT" && c.text);
    if (t?.text) return t.text.slice(0, 60);
    if ((e.node.bounds?.width ?? 0) > 800) break;
  }
  return null;
}

function listFiles(dir: string, depth = 0): string[] {
  try {
    return readdirSync(dir).flatMap((name) => {
      const full = path.join(dir, name);
      const info = statSync(full);
      return info.isDirectory() ? (depth < 4 ? listFiles(full, depth + 1) : []) : [full];
    });
  } catch {
    return [];
  }
}

export function collectAssets(
  viewports: Array<{ breakpoint: Breakpoint; index: DesignIndex }>,
  options: AssetOptions,
): AssetEntry[] {
  const images = new Map<string, AssetEntry>();
  const provisional = new Map<string, { base: string; role: string }>();
  const icons = new Map<string, AssetEntry>();
  const nameCount = new Map<string, number>();
  const uniqueName = (base: string) => {
    const n = (nameCount.get(base) ?? 0) + 1;
    nameCount.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };

  for (const { breakpoint, index } of viewports) {
    const vw = index.root.bounds?.width ?? 1;

    // ---- raster images (image fills): one asset per distinct imageRef
    for (const entry of index.entries) {
      const node = entry.node;
      const fill = (node.fills ?? []).find((f: any) => f?.type === "IMAGE" && f.visible !== false);
      if (!fill || !node.bounds) continue;
      const imageRef: string = fill.imageRef ?? fill.imageHash ?? node.id ?? "unknown";
      const role = node.bounds.width >= vw * 0.9 ? "background" : "content";
      const sectionId = options.sectionOf(entry, breakpoint);
      let asset = images.get(imageRef);
      if (!asset) {
        const base = `${sectionId ? sectionId.replace(/^\d+-/, "") : "page"}-${role === "background" ? "bg" : "image"}`;
        const name = uniqueName(base);
        provisional.set(imageRef, { base, role });
        asset = {
          id: `image-${images.size + 1}`, kind: "image", expectedName: name,
          acceptedExtensions: ["webp", "jpg", "jpeg", "png", "avif"],
          width: Math.round(node.bounds.width), height: Math.round(node.bounds.height), imageRef,
          usages: [], status: "pending", publicPath: null,
          figmaExport: { fileKey: options.fileKey, nodeIds: [], format: "png", note: "Image fills are fetched with GET /v1/files/:key/images (imageRef -> URL) or exported per node with GET /v1/images/:key?ids=…" },
          aliases: [imageRef, node.name],
        };
        images.set(imageRef, asset);
      }
      asset.width = Math.max(asset.width, Math.round(node.bounds.width));
      asset.height = Math.max(asset.height, Math.round(node.bounds.height));
      if (node.id) asset.figmaExport.nodeIds.push(node.id);
      asset.usages.push({ nodeId: node.id, nodeName: node.name, breakpoint, role, sectionId, bounds: node.bounds, contextText: null });
    }

    // ---- icons / vector artwork: outermost icon-sized frame made only of vectors
    const walk = (entry: Entry) => {
      if (isIconRoot(entry.node, options.iconMaxSize)) {
        const node = entry.node;
        const sig = iconSignature(node);
        let asset = icons.get(sig);
        if (!asset) {
          const name = uniqueName(`icon-${Math.round(node.bounds!.width)}x${Math.round(node.bounds!.height)}`);
          asset = {
            id: `icon-${icons.size + 1}`, kind: "icon", expectedName: name, acceptedExtensions: ["svg"],
            width: Math.round(node.bounds!.width), height: Math.round(node.bounds!.height), imageRef: null,
            usages: [], status: "pending", publicPath: null,
            figmaExport: { fileKey: options.fileKey, nodeIds: [], format: "svg", note: "Export one representative node with GET /v1/images/:key?ids=…&format=svg" },
            aliases: [node.name],
          };
          icons.set(sig, asset);
        }
        if (node.id) asset.figmaExport.nodeIds.push(node.id);
        asset.usages.push({ nodeId: node.id, nodeName: node.name, breakpoint, role: "icon", sectionId: options.sectionOf(entry, breakpoint), bounds: node.bounds, contextText: nearbyText(entry) });
        return;
      }
      for (const child of entry.node.children) {
        if (child.visible === false) continue;
        const childEntry = index.byId.get(child.id ?? "");
        if (childEntry) walk(childEntry);
      }
    };
    walk(index.entries[0]!);
  }

  // An image reused by several sections is a shared asset: name it for what it is, not for its first use.
  let shared = 0;
  for (const asset of images.values()) {
    if (new Set(asset.usages.map((u) => u.sectionId)).size > 1) {
      const role = asset.usages.some((u) => u.role === "background") ? "bg" : "image";
      asset.expectedName = `shared-${role}-${++shared}`;
    }
  }
  const assets = [...images.values(), ...icons.values()];

  // ---- match delivered files
  if (options.assetsDir) {
    const files = listFiles(options.assetsDir);
    const byKey = new Map<string, string>();
    for (const file of files) byKey.set(slugify(path.basename(file, path.extname(file))), file);
    const root = path.resolve(options.assetsDir);
    for (const asset of assets) {
      const mapped = options.assetMap[asset.expectedName] ?? options.assetMap[asset.id];
      const keys = [asset.expectedName, ...asset.aliases].map(slugify);
      const file = mapped
        ? files.find((f) => f.endsWith(mapped.replace(/^[\\/]/, "")) || path.basename(f) === mapped)
        : keys.map((k) => byKey.get(k)).find(Boolean);
      const okExt = file && asset.acceptedExtensions.includes(path.extname(file).slice(1).toLowerCase());
      if (file && okExt) {
        asset.status = "provided";
        asset.publicPath = `${options.basePath.replace(/\/$/, "")}/${path.relative(root, file).split(path.sep).join("/")}`;
      }
    }
  }
  return assets;
}
