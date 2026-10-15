import { readFile, stat } from "node:fs/promises";
import path from "node:path";

export interface GenerationInputs {
  contentPath: string;
  referencePaths: string[];
}

async function requireFile(filePath: string, label: string): Promise<void> {
  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error(`${label} is not a file: ${filePath}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`${label} was not found: ${filePath}`);
    }
    throw error;
  }
}

export async function validateGenerationInputs(
  inputs: GenerationInputs,
  requireReference = true,
): Promise<void> {
  await requireFile(inputs.contentPath, "DOCX content");
  if (path.extname(inputs.contentPath).toLowerCase() !== ".docx") {
    throw new Error(`DOCX content must use a .docx extension: ${inputs.contentPath}`);
  }
  if (requireReference && inputs.referencePaths.length === 0) {
    throw new Error("A reference PNG is required for design-accurate generation. Pass --reference-desktop.");
  }
  for (const referencePath of inputs.referencePaths) {
    await requireFile(referencePath, "Reference screenshot");
    if (path.extname(referencePath).toLowerCase() !== ".png") {
      throw new Error(`Reference screenshot must be a PNG: ${referencePath}`);
    }
    const signature = await readFile(referencePath, { encoding: null });
    const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
    if (signature.length < pngSignature.length || !pngSignature.every((byte, index) => signature[index] === byte)) {
      throw new Error(`Reference screenshot is not a valid PNG: ${referencePath}`);
    }
  }
}
