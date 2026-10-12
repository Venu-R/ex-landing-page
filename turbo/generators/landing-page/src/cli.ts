import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { z } from "zod";

import type {
  GenerationOptions,
  LandingPageBlueprint
} from "@bdmg/types";

import { generatePage } from "./page-generator.js";

const CliBlueprintSchema = z.object({
  schemaVersion: z.string(),
  project: z.string(),
  framework: z.string(),
  sections: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      order: z.number(),
      content: z.array(z.object({
        id: z.string(),
        type: z.enum([
          "heading",
          "paragraph",
          "list",
          "table",
          "image"
        ]),
        sourceBlockIndex: z.number()
      }).passthrough()),
      mappingRequired: z.boolean(),
      designNodeId: z.string().nullable()
    }).passthrough()
  ),
  validation: z.object({
    status: z.enum(["valid", "needs-review"]),
    errors: z.array(z.string()),
    warnings: z.array(z.string())
  }).passthrough()
}).passthrough();

function getArgument(name: string): string | undefined {
  const index = process.argv.indexOf(name);

  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

async function main(): Promise<void> {
  const generatorDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(generatorDir, "../../../..");

const blueprintPath = path.resolve(
  repoRoot,
  getArgument("--blueprint") ??
    "output/landing-page-blueprint.json"
);

const outputDir = path.resolve(
  repoRoot,
  getArgument("--output") ??
    "generated-landing-page"
);

  const strictMappings = process.argv.includes("--strict-mappings");

  const raw = await readFile(blueprintPath, "utf8");
  const parsed: unknown = JSON.parse(raw);

  const result = CliBlueprintSchema.safeParse(parsed);

  if (!result.success) {
    console.error("The supplied blueprint is invalid.");
    console.error(z.prettifyError(result.error));
    process.exitCode = 1;
    return;
  }

  const blueprint = parsed as LandingPageBlueprint;

  if (blueprint.validation.status === "needs-review") {
    console.warn(
      "Warning: the blueprint has validation warnings or errors."
    );

    for (const warning of blueprint.validation.warnings) {
      console.warn(`- ${warning}`);
    }

    for (const error of blueprint.validation.errors) {
      console.warn(`- ${error}`);
    }
  }

  if (strictMappings) {
    const unmapped = blueprint.sections.filter(
      section => section.mappingRequired && !section.designNodeId
    );

    if (unmapped.length > 0) {
      console.error(
        `Strict mapping check failed: ${unmapped.length} section(s) require design mapping.`
      );
      process.exitCode = 1;
      return;
    }
  }

  const options: GenerationOptions = {
    blueprintPath,
    outputDir,
    projectName: blueprint.project,
    strictMappings
  };

  await generatePage(blueprint, options);

  console.log("Landing page generated successfully.");
  console.log(`Blueprint: ${blueprintPath}`);
  console.log(`Output:    ${outputDir}`);
}

const invokedPath = process.argv[1];

if (
  invokedPath &&
  import.meta.url === pathToFileURL(path.resolve(invokedPath)).href
) {
  main().catch(error => {
    console.error("Landing page generation failed:", error);
    process.exitCode = 1;
  });
}