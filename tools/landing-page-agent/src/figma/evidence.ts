import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FigmaEvidence } from "../content/model.js";

export async function readFigmaEvidence(filePath: string): Promise<FigmaEvidence> {
  const value: unknown = JSON.parse(await readFile(filePath, "utf8"));
  if (!value || typeof value !== "object") throw new Error(`Invalid Figma evidence JSON: ${filePath}`);
  const evidence = value as Partial<FigmaEvidence>;
  if (!["figma-mcp", "figma-api-json"].includes(evidence.source ?? "") || typeof evidence.fileKey !== "string" || !evidence.fileKey.trim() || !Array.isArray(evidence.sections)
    || evidence.sections.length === 0
    || evidence.sections.some((section) => !section || typeof section !== "object" || typeof section.nodeId !== "string" || typeof section.name !== "string")) {
    throw new Error(`Figma evidence must contain source "figma-mcp" or "figma-api-json", a fileKey, and at least one valid section: ${filePath}`);
  }
  const source = evidence.source;
  if (source !== "figma-mcp" && source !== "figma-api-json") throw new Error(`Unsupported Figma evidence source: ${filePath}`);
  const sections = evidence.sections as FigmaEvidence["sections"];
  if (evidence.responsiveFrames !== undefined && (!Array.isArray(evidence.responsiveFrames)
    || evidence.responsiveFrames.some((frame) => !frame || typeof frame.nodeId !== "string" || typeof frame.name !== "string"
      || (frame.width !== undefined && (!Number.isFinite(frame.width) || frame.width <= 0))
      || (frame.height !== undefined && (!Number.isFinite(frame.height) || frame.height <= 0))))) {
    throw new Error(`Figma evidence contains an invalid responsive frame: ${filePath}`);
  }
  for (const section of sections) {
    for (const dimension of ["width", "height"] as const) {
      if (section[dimension] !== undefined && (!Number.isFinite(section[dimension]) || section[dimension] <= 0)) {
        throw new Error(`Figma evidence section "${section.name}" has an invalid ${dimension}: ${filePath}`);
      }
    }
    for (const asset of section.assets ?? []) {
      if (!asset.name.trim() || !asset.url.trim() || !["image", "svg", "render"].includes(asset.type)) {
        throw new Error(`Figma evidence section "${section.name}" contains an invalid asset: ${filePath}`);
      }
    }
  }
  return {
    source,
    fileKey: evidence.fileKey,
    nodeId: evidence.nodeId ?? null,
    capturedAt: evidence.capturedAt ?? new Date().toISOString(),
    sections: evidence.sections,
    responsiveFrames: Array.isArray(evidence.responsiveFrames) ? evidence.responsiveFrames : [],
    screenshots: evidence.screenshots ?? [],
  };
}

export function assetManifest(evidence: FigmaEvidence): Array<{ name: string; url: string; section: string; type: "image" | "svg" | "render" }> {
  return evidence.sections.flatMap((section) => (section.assets ?? []).map((asset) => ({ ...asset, section: section.name })));
}

function safeAssetName(name: string, index: number): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "-");
  return base || `asset-${index}`;
}

export interface LocalizedAsset {
  name: string;
  url: string;
  section: string;
  type: "image" | "svg" | "render";
  status: "localized" | "failed";
  localPath?: string;
  error?: string;
}

export async function localizeFigmaAssets(evidence: FigmaEvidence, publicDir: string): Promise<LocalizedAsset[]> {
  const assets = assetManifest(evidence);
  const assetDir = path.join(publicDir, "assets");
  await mkdir(assetDir, { recursive: true });
  const usedNames = new Set<string>();
  const localized: LocalizedAsset[] = [];
  for (const [index, asset] of assets.entries()) {
    let filename = safeAssetName(asset.name, index);
    while (usedNames.has(filename)) filename = `${path.parse(filename).name}-${index}${path.extname(filename)}`;
    usedNames.add(filename);
    const outputPath = path.join(assetDir, filename);
    try {
      const parsed = new URL(asset.url);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error(`Unsupported asset URL protocol: ${parsed.protocol}`);
      const response = await fetch(parsed);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));
      localized.push({ ...asset, status: "localized", localPath: `public/assets/${filename}` });
    } catch (error) {
      localized.push({ ...asset, status: "failed", error: error instanceof Error ? error.message : String(error) });
    }
  }
  return localized;
}
