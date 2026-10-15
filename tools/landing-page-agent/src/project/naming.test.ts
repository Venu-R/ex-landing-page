import { describe, expect, it } from "vitest";
import { slugify } from "./naming.js";

describe("slugify", () => {
  it("creates stable safe app names", () => {
    expect(slugify("  Café Pricing / 2026! ")).toBe("cafe-pricing-2026");
  });

  it("uses a safe fallback for empty input", () => {
    expect(slugify("!!!")).toBe("landing-page");
  });
});
