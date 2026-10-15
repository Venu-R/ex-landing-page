import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ParsedFigmaUrl } from "./url.js";
import type { FigmaEvidence } from "../content/model.js";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object";
}

function findNode(value: unknown, nodeId: string): JsonRecord | null {
  if (!isRecord(value)) return null;
  if (value.id === nodeId) return value;
  if (Array.isArray(value.children)) {
    for (const child of value.children) {
      const found = findNode(child, nodeId);
      if (found) return found;
    }
  }
  return null;
}

function nodeBounds(node: JsonRecord): { width?: number; height?: number } {
  const box = isRecord(node.absoluteBoundingBox) ? node.absoluteBoundingBox : null;
  return {
    width: typeof box?.width === "number" ? box.width : undefined,
    height: typeof box?.height === "number" ? box.height : undefined,
  };
}

function nodeText(node: JsonRecord): string[] {
  const text: string[] = [];
  const walk = (value: unknown) => {
    if (!isRecord(value)) return;
    if (value.type === "TEXT" && typeof value.characters === "string" && value.characters.trim()) text.push(value.characters);
    if (Array.isArray(value.children)) value.children.forEach(walk);
  };
  walk(node);
  return text;
}

function rawToEvidence(raw: unknown, figma: ParsedFigmaUrl): FigmaEvidence {
  if (!isRecord(raw) || !isRecord(raw.document)) throw new Error("Figma API response is malformed: missing document.");
  const document = raw.document;
  const root = figma.nodeId ? findNode(document, figma.nodeId) : document;
  if (!root) throw new Error(`Figma API response does not contain requested node ${figma.nodeId}.`);
  const children = Array.isArray(root.children) ? root.children.filter(isRecord) : [];
  const sections = (children.length ? children : [root]).map((node, index) => ({
    nodeId: typeof node.id === "string" ? node.id : `${figma.nodeId ?? "root"}:${index}`,
    name: typeof node.name === "string" && node.name.trim() ? node.name : `Section ${index + 1}`,
    ...nodeBounds(node),
    text: nodeText(node),
    styles: {},
    assets: [],
  }));
  return {
    source: "figma-api-json",
    fileKey: figma.fileKey,
    nodeId: figma.nodeId,
    capturedAt: new Date().toISOString(),
    sections,
    responsiveFrames: [],
    screenshots: [],
  };
}

async function readJson(filePath: string): Promise<unknown | null> {
  try {
    await access(filePath);
    return JSON.parse(await readFile(filePath, "utf8")) as unknown;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    if (error instanceof SyntaxError) throw new Error(`Saved Figma response is invalid JSON: ${filePath}`);
    throw error;
  }

}

async function localToken(repoRoot: string): Promise<string | undefined> {
  if (process.env.FIGMA_ACCESS_TOKEN) return process.env.FIGMA_ACCESS_TOKEN;
  try {
    const dotenv = await readFile(path.join(repoRoot, ".env"), "utf8");
    const line = dotenv.split(/\r?\n/).find((entry) => entry.startsWith("FIGMA_ACCESS_TOKEN="));
    const value = line?.slice("FIGMA_ACCESS_TOKEN=".length).trim();
    return value || undefined;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return undefined;
  }
}

export interface FigmaAcquisitionResult {
  responsePath: string;
  rawResponse: unknown;
  evidence: FigmaEvidence;
  reused: boolean;
}

export async function acquireFigmaResponse(options: {
  repoRoot: string;
  fixtureName: string;
  figma: ParsedFigmaUrl;
  refresh?: boolean;
  accessToken?: string;
}): Promise<FigmaAcquisitionResult> {
  const responsePath = path.join(options.repoRoot, "fixtures", options.fixtureName, "figma-response.json");
  const saved = options.refresh ? null : await readJson(responsePath);
  if (saved) {
    const savedNode = options.figma.nodeId ? findNode(isRecord(saved) ? saved.document : null, options.figma.nodeId) : null;
    if (isRecord(saved) && isRecord(saved.document) && (!options.figma.nodeId || savedNode)) {
      return { responsePath, rawResponse: saved, evidence: rawToEvidence(saved, options.figma), reused: true };
    }
    if (!options.accessToken) throw new Error(`Saved Figma response does not contain ${options.figma.nodeId}; set FIGMA_ACCESS_TOKEN to refresh ${responsePath}.`);
  }
  const token = options.accessToken ?? await localToken(options.repoRoot);
  if (!token) throw new Error(`Figma response is required for ${options.figma.fileKey}${options.figma.nodeId ? ` node ${options.figma.nodeId}` : ""}. Set FIGMA_ACCESS_TOKEN in a local .env file or restore a valid ${responsePath}.`);
  const endpoint = `https://api.figma.com/v1/files/${encodeURIComponent(options.figma.fileKey)}${options.figma.nodeId ? `?ids=${encodeURIComponent(options.figma.nodeId)}` : ""}`;
  let response: Response;
  try {
    response = await fetch(endpoint, { headers: { "X-Figma-Token": token } });
  } catch (error) {
    throw new Error(`Figma API network request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (response.status === 401 || response.status === 403) throw new Error(`Figma API authentication/permission failed (${response.status}). Check FIGMA_ACCESS_TOKEN and file access.`);
  if (response.status === 429) throw new Error("Figma API rate limit reached. Retry later or provide a valid saved fixtures/<page>/figma-response.json.");
  if (!response.ok) throw new Error(`Figma API request failed with HTTP ${response.status}. Check the file key, node ID, token, and permissions.`);
  let raw: unknown;
  try { raw = await response.json(); } catch { throw new Error("Figma API returned malformed JSON."); }
  const evidence = rawToEvidence(raw, options.figma);
  await mkdir(path.dirname(responsePath), { recursive: true });
  await writeFile(responsePath, `${JSON.stringify(raw, null, 2)}\n`, "utf8");
  return { responsePath, rawResponse: raw, evidence, reused: false };
}

export function validateFigmaApiResponse(raw: unknown, figma: ParsedFigmaUrl): boolean {
  if (!isRecord(raw) || !isRecord(raw.document)) return false;
  return !figma.nodeId || Boolean(findNode(raw.document, figma.nodeId));
}
