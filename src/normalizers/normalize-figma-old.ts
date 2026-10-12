import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Figma normalizer.
 *
 * It deliberately preserves the original Figma node properties in `sourceNode`
 * (excluding children, which are normalized recursively). This avoids silently
 * throwing away properties that a future renderer may need.
 */

type JsonObject = Record<string, unknown>;

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstRecord(...values: unknown[]): JsonObject | undefined {
  return values.find(isRecord);
}

function normalizeNode(input: JsonObject): JsonObject {
  const sourceChildren = Array.isArray(input.children) ? input.children : [];
  const { children: _children, ...sourceNodeWithoutChildren } = input;

  const absoluteBounds = isRecord(input.absoluteBoundingBox)
    ? input.absoluteBoundingBox
    : isRecord(input.absoluteRenderBounds)
      ? input.absoluteRenderBounds
      : null;

  const relativeTransform = isRecord(input.relativeTransform) ? input.relativeTransform : null;
  const bounds = absoluteBounds && [
    absoluteBounds.x, absoluteBounds.y, absoluteBounds.width, absoluteBounds.height,
  ].every((value) => typeof value === "number")
    ? {
        x: absoluteBounds.x as number,
        y: absoluteBounds.y as number,
        width: absoluteBounds.width as number,
        height: absoluteBounds.height as number,
      }
    : null;

  const style = isRecord(input.style) ? input.style : null;
  const componentProperties = isRecord(input.componentProperties) ? input.componentProperties : {};

  return {
    id: typeof input.id === "string" ? input.id : null,
    name: typeof input.name === "string" ? input.name : "",
    type: typeof input.type === "string" ? input.type : "UNKNOWN",
    text: typeof input.characters === "string" ? input.characters : null,
    bounds,
    // Explicit common fields make downstream consumption convenient.
    relativeTransform,
    fills: Array.isArray(input.fills) ? input.fills : [],
    strokes: Array.isArray(input.strokes) ? input.strokes : [],
    effects: Array.isArray(input.effects) ? input.effects : [],
    cornerRadius: input.cornerRadius ?? null,
    opacity: typeof input.opacity === "number" ? input.opacity : null,
    visible: typeof input.visible === "boolean" ? input.visible : null,
    locked: typeof input.locked === "boolean" ? input.locked : null,
    clipsContent: typeof input.clipsContent === "boolean" ? input.clipsContent : null,
    constraints: input.constraints ?? null,
    layoutMode: typeof input.layoutMode === "string" ? input.layoutMode : null,
    layoutWrap: input.layoutWrap ?? null,
    layoutSizingHorizontal: input.layoutSizingHorizontal ?? null,
    layoutSizingVertical: input.layoutSizingVertical ?? null,
    primaryAxisSizingMode: input.primaryAxisSizingMode ?? null,
    counterAxisSizingMode: input.counterAxisSizingMode ?? null,
    primaryAxisAlignItems: input.primaryAxisAlignItems ?? null,
    counterAxisAlignItems: input.counterAxisAlignItems ?? null,
    counterAxisAlignContent: input.counterAxisAlignContent ?? null,
    itemSpacing: typeof input.itemSpacing === "number" ? input.itemSpacing : null,
    counterAxisSpacing: input.counterAxisSpacing ?? null,
    paddingLeft: input.paddingLeft ?? null,
    paddingRight: input.paddingRight ?? null,
    paddingTop: input.paddingTop ?? null,
    paddingBottom: input.paddingBottom ?? null,
    style,
    characterStyleOverrides: Array.isArray(input.characterStyleOverrides) ? input.characterStyleOverrides : [],
    styleOverrideTable: isRecord(input.styleOverrideTable) ? input.styleOverrideTable : {},
    componentId: input.componentId ?? null,
    componentProperties,
    isComponent: input.type === "COMPONENT",
    isInstance: input.type === "INSTANCE",
    exportSettings: Array.isArray(input.exportSettings) ? input.exportSettings : [],
    // Complete original node properties, including fields not yet understood by this pipeline.
    sourceNode: sourceNodeWithoutChildren,
    children: sourceChildren.filter(isRecord).map((child) => normalizeNode(child)),
  };
}

async function main(): Promise<void> {
  const inputPath = path.resolve(process.argv[2] ?? "figma-response.json");
  const outputDir = path.resolve(process.argv[3] ?? "output");
  await mkdir(outputDir, { recursive: true });

  const rawText = await readFile(inputPath, "utf8");
  const parsed: unknown = JSON.parse(rawText);
  if (!isRecord(parsed)) throw new Error("Figma response must be a JSON object.");

  const data = firstRecord(parsed.data);
  const document = firstRecord(parsed.document, data?.document, parsed);
  if (!document || typeof document.id !== "string" || !Array.isArray(document.children)) {
    throw new Error(
      "Could not find a Figma document tree. Expected document or data.document with an id and children. " +
      "For a single-node endpoint response, pass the node object as the input."
    );
  }

  const normalized = {
    schemaVersion: "2.1.0",
    source: {
      filename: path.basename(inputPath),
      format: "figma-rest-api",
      fileName: typeof parsed.name === "string" ? parsed.name : typeof data?.name === "string" ? data.name : null,
      lastModified: typeof parsed.lastModified === "string"
        ? parsed.lastModified
        : typeof data?.lastModified === "string" ? data.lastModified : null,
      version: parsed.version ?? data?.version ?? null,
      role: parsed.role ?? data?.role ?? null,
      editorType: parsed.editorType ?? data?.editorType ?? null,
      sourceUrl: process.env.BDMG_FIGMA_URL ?? process.env.FIGMA_SOURCE_URL ?? null,
    },
    document: normalizeNode(document),
  };

  const outputPath = path.join(outputDir, "normalized-design.json");
  await writeFile(outputPath, JSON.stringify(normalized, null, 2), "utf8");
  console.log(`Created ${outputPath}`);
  console.log(`Root: ${normalized.document.name} (${normalized.document.id})`);
  console.log(`Top-level children: ${Array.isArray(normalized.document.children) ? normalized.document.children.length : 0}`);
}

main().catch((error: unknown) => {
  console.error("Figma normalization failed:", error);
  process.exitCode = 1;
});
