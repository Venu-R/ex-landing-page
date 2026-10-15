import { describe, expect, it } from "vitest";
import { buildSiteContent, reconcileContentAndDesign } from "./model.js";

describe("content model", () => {
  it("preserves sections, links, and assets from parsed content", () => {
    const content = buildSiteContent({
      schemaVersion: "1.0.0",
      source: { filename: "input.docx", parser: "mammoth", warnings: [] },
      blocks: [
        { type: "heading", level: 1, text: "Hero" },
        { type: "paragraph", text: "Visit us", links: [{ text: "site", href: "https://example.com" }] },
        { type: "image", alt: "Hero image", src: "image.png", title: null },
      ],
    });
    expect(content.sections).toHaveLength(1);
    expect(content.links?.[0]?.href).toBe("https://example.com");
    expect(content.assets?.[0]?.alt).toBe("Hero image");
  });

  it("records missing design evidence instead of inventing matches", () => {
    const content = buildSiteContent({
      schemaVersion: "1.0.0",
      source: { filename: "input.docx", parser: "mammoth", warnings: [] },
      blocks: [{ type: "heading", level: 1, text: "Hero" }],
    });
    const result = reconcileContentAndDesign(content);
    expect(result.issues[0]?.type).toBe("unverified-design");
    expect(result.matchedSections[0]?.figmaNodeId).toBeNull();
  });

  it("records numeric or currency conflicts between content and design evidence", () => {
    const content = buildSiteContent({
      schemaVersion: "1.0.0",
      source: { filename: "input.docx", parser: "mammoth", warnings: [] },
      blocks: [{ type: "heading", level: 1, text: "Pricing" }, { type: "paragraph", text: "$10" }],
    });
    const result = reconcileContentAndDesign(content, {
      source: "figma-mcp",
      fileKey: "file",
      nodeId: null,
      capturedAt: "2026-01-01T00:00:00.000Z",
      sections: [{ nodeId: "1:2", name: "Pricing", text: ["$20"] }],
      responsiveFrames: [],
    });
    expect(result.issues.some((issue) => issue.type === "conflict")).toBe(true);
  });
});
