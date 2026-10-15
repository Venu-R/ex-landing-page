import { writeFile, mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateGenerationInputs } from "./validation.js";

describe("generation input contract", () => {
  it("requires a DOCX and a desktop PNG reference", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "landing-inputs-"));
    const contentPath = path.join(root, "content.docx");
    await writeFile(contentPath, "placeholder");
    await expect(validateGenerationInputs({ contentPath, referencePaths: [] })).rejects.toThrow("reference PNG");
  });

  it("accepts explicit DOCX and PNG paths", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "landing-inputs-"));
    const contentPath = path.join(root, "content.docx");
    const referencePath = path.join(root, "reference-desktop.png");
    await writeFile(contentPath, "placeholder");
    await writeFile(referencePath, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    await expect(validateGenerationInputs({ contentPath, referencePaths: [referencePath] })).resolves.toBeUndefined();
  });
});
