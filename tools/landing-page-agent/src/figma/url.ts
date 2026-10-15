export interface ParsedFigmaUrl {
  url: string;
  fileKey: string;
  nodeId: string | null;
}

export function parseFigmaUrl(url: string): ParsedFigmaUrl {
  const parsed = new URL(url);
  const parts = parsed.pathname.split("/").filter(Boolean);
  const designIndex = parts.findIndex((part) => ["design", "file", "proto"].includes(part));
  const fileKey = designIndex >= 0 ? parts[designIndex + 1] : null;
  if (!fileKey) throw new Error(`Could not extract a Figma file key from ${url}`);
  const rawNodeId = parsed.searchParams.get("node-id");
  return {
    url,
    fileKey,
    nodeId: rawNodeId ? rawNodeId.replace("-", ":") : null,
  };
}
