import { createServer } from "node:http";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { assetManifest, localizeFigmaAssets, readFigmaEvidence } from "./evidence.js";

describe("Figma evidence", () => {
  it("flattens section assets into a reusable manifest", () => {
    const manifest = assetManifest({
      source: "figma-mcp",
      fileKey: "file",
      nodeId: "1:2",
      capturedAt: "2026-01-01T00:00:00.000Z",
      responsiveFrames: [],
      sections: [{ nodeId: "1:3", name: "Hero", assets: [{ name: "hero.png", url: "https://example.com/hero.png", type: "image" }] }],
    });
    expect(manifest).toEqual([{ name: "hero.png", url: "https://example.com/hero.png", type: "image", section: "Hero" }]);
  });

  it("downloads and verifies HTTP assets into the app asset directory", async () => {
    const server = createServer((_, response) => {
      response.writeHead(200, { "content-type": "image/svg+xml" });
      response.end("<svg xmlns=\"http://www.w3.org/2000/svg\" />");
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not bind");
    const root = await mkdtemp(path.join(os.tmpdir(), "landing-assets-"));
    const result = await localizeFigmaAssets({
      source: "figma-mcp",
      fileKey: "file",
      nodeId: null,
      capturedAt: "2026-01-01T00:00:00.000Z",
      responsiveFrames: [],
      sections: [{ nodeId: "1:2", name: "Hero", assets: [{ name: "hero.svg", url: `http://127.0.0.1:${address.port}/hero.svg`, type: "svg" }] }],
    }, root);
    expect(result[0]?.status).toBe("localized");
    expect(await readFile(path.join(root, "assets", "hero.svg"), "utf8")).toContain("<svg");
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("rejects incomplete evidence instead of treating it as design-accurate", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "landing-evidence-"));
    const filePath = path.join(root, "evidence.json");
    await writeFile(filePath, JSON.stringify({
      source: "figma-mcp",
      fileKey: "file",
      sections: [],
    }));
    await expect(readFigmaEvidence(filePath)).rejects.toThrow("at least one valid section");
  });
});
