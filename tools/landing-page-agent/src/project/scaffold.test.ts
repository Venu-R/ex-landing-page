import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { scaffoldApp } from "./scaffold.js";
import { readFile as readText } from "node:fs/promises";

const content = {
  title: "Test Page",
  description: "A test landing page.",
  figmaUrl: null,
  sections: [],
  blocks: [],
};

describe("scaffoldApp", () => {
  it("creates an independent app and refuses accidental overwrite", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "landing-agent-"));
    const options = { contentPath: "content.docx", figmaUrl: "https://www.figma.com/design/key/Page", repoRoot };
    await scaffoldApp(content, options);
    await expect(scaffoldApp(content, options)).rejects.toThrow("App already exists");
    expect(await readFile(path.join(repoRoot, "apps", "test-page", "README.md"), "utf8")).toContain("Test Page");
    const sections = await readFile(path.join(repoRoot, "apps", "test-page", "src", "sections", "PageSections.tsx"), "utf8");
    expect(sections).toContain("pageContent.sections.map");
    expect(sections).not.toContain("PricingCards");
  });

  it("generates a non-pricing section structure from synthetic design evidence", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "landing-agent-synthetic-"));
    const report = await scaffoldApp({
      title: "Product Launch",
      description: "A product launch page.",
      figmaUrl: null,
      sections: [
        { id: "01-hero", title: "Hero", level: 1, blocks: [{ type: "heading", level: 1, text: "Hero" }, { type: "paragraph", text: "Launch better products" }] },
        { id: "02-testimonials", title: "Testimonials", level: 1, blocks: [{ type: "heading", level: 1, text: "Testimonials" }, { type: "list", ordered: false, items: ["Loved by teams"] }] },
        { id: "03-contact", title: "Contact", level: 1, blocks: [{ type: "heading", level: 1, text: "Contact" }, { type: "paragraph", text: "Talk to our team" }] }
      ],
      blocks: [],
    }, {
      contentPath: "synthetic.docx",
      figmaUrl: "https://www.figma.com/design/synthetic-design/Synthetic?node-id=0-1",
      repoRoot,
      figmaEvidence: {
        source: "figma-mcp",
        fileKey: "synthetic-design",
        nodeId: "0:1",
        capturedAt: "2026-10-14T00:00:00.000Z",
        sections: [
          { nodeId: "1:2", name: "Hero", text: ["Launch better products"] },
          { nodeId: "1:20", name: "Testimonials", text: ["What teams say"] },
          { nodeId: "1:30", name: "Contact", text: ["Talk to our team"] },
        ],
        responsiveFrames: [{ nodeId: "2:1", name: "Mobile", width: 390, height: 844 }],
      },
    });
    expect(report.checks.find((check) => check.name === "Figma MCP evidence")?.status).toBe("passed");
    expect(report.evidence?.responsiveFrames).toBe(1);
    expect(await readText(path.join(repoRoot, "apps", "product-launch", "src", "data", "page-content.ts"), "utf8")).toContain("Testimonials");
  });
});
