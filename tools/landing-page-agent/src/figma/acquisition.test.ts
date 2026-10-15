import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { acquireFigmaResponse, validateFigmaApiResponse } from "./acquisition.js";
import { parseFigmaUrl } from "./url.js";

const figma = parseFigmaUrl("https://www.figma.com/design/file-key/Page?node-id=1-2");
const raw = {
  document: {
    id: "0:0",
    type: "DOCUMENT",
    children: [{ id: "1:2", name: "Root", type: "FRAME", absoluteBoundingBox: { width: 100, height: 200 }, children: [] }],
  },
};

describe("Figma API acquisition", () => {
  it("reuses a valid saved response without a token or network request", async () => {
    const repoRoot = await os.tmpdir();
    const root = await mkdtemp(path.join(repoRoot, "figma-reuse-"));
    await mkdir(path.join(root, "fixtures", "page"), { recursive: true });
    await writeFile(path.join(root, "fixtures", "page", "figma-response.json"), JSON.stringify(raw));
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await acquireFigmaResponse({ repoRoot: root, fixtureName: "page", figma });
    expect(result.reused).toBe(true);
    expect(result.evidence.source).toBe("figma-api-json");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("saves the unmodified successful API response", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "figma-fetch-"));
    const response = new Response(JSON.stringify(raw), { status: 200, headers: { "content-type": "application/json" } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
    const result = await acquireFigmaResponse({ repoRoot: root, fixtureName: "page", figma, accessToken: "secret" });
    expect(result.reused).toBe(false);
    expect(JSON.parse(await readFile(result.responsePath, "utf8"))).toEqual(raw);
    vi.unstubAllGlobals();
  });

  it("reports missing tokens and common API failures", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "figma-errors-"));
    await expect(acquireFigmaResponse({ repoRoot: root, fixtureName: "page", figma })).rejects.toThrow("FIGMA_ACCESS_TOKEN");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 429 })));
    await expect(acquireFigmaResponse({ repoRoot: root, fixtureName: "page", figma, accessToken: "secret" })).rejects.toThrow("rate limit");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 401 })));
    await expect(acquireFigmaResponse({ repoRoot: root, fixtureName: "page", figma, accessToken: "secret" })).rejects.toThrow("authentication");
    vi.unstubAllGlobals();
  });

  it("rejects malformed saved JSON instead of substituting evidence", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "figma-invalid-"));
    const dir = path.join(root, "fixtures", "page");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "figma-response.json"), "{not-json");
    await expect(acquireFigmaResponse({ repoRoot: root, fixtureName: "page", figma })).rejects.toThrow("invalid JSON");
  });

  it("validates the requested file node in raw JSON", () => {
    expect(validateFigmaApiResponse(raw, figma)).toBe(true);
    expect(validateFigmaApiResponse({ document: { children: [] } }, figma)).toBe(false);
    expect(validateFigmaApiResponse({}, figma)).toBe(false);
  });
});
