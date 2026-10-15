import { describe, expect, it } from "vitest";
import { parseFigmaUrl } from "./url.js";

describe("parseFigmaUrl", () => {
  it("extracts a file key and normalized node id", () => {
    expect(parseFigmaUrl("https://www.figma.com/design/abc123/Page?node-id=12-34")).toEqual({
      url: "https://www.figma.com/design/abc123/Page?node-id=12-34",
      fileKey: "abc123",
      nodeId: "12:34",
    });
  });

  it("rejects URLs without a Figma file key", () => {
    expect(() => parseFigmaUrl("https://example.com/page")).toThrow("Could not extract");
  });
});
