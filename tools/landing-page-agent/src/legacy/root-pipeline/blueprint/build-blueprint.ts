import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildBlueprint, type BlueprintConfig } from "./build";

/**
 * CLI:  tsx src/blueprint/build-blueprint.ts [outputDir] [contentJson] [designJson] [flags]
 *
 *   --config <file>     blueprint config (default: ./bdmg.blueprint.json if present)
 *   --assets <dir>      folder with the files delivered by the content team
 *   --figma-url <url>   source Figma link (or BDMG_FIGMA_URL)
 *   --client <name>     project/client name (or BDMG_PROJECT_NAME)
 *   --require-assets    treat pending assets as a warning
 *
 * The logic lives in ./build (pure function) so the `turbo gen` generator can
 * call buildBlueprint() directly instead of shelling out to this file.
 */
function parseArgs(argv: string[]) {
  const positional: string[] = [];
  const flags: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg.startsWith("--")) {
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) { flags[arg.slice(2)] = next; i++; }
      else flags[arg.slice(2)] = true;
    } else positional.push(arg);
  }
  return { positional, flags };
}

async function main(): Promise<void> {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const outputDir = path.resolve(positional[0] ?? "output");
  const contentPath = path.resolve(positional[1] ?? path.join(outputDir, "normalized-content.json"));
  const designPath = path.resolve(positional[2] ?? path.join(outputDir, "normalized-design.json"));

  const configPath = typeof flags.config === "string" ? path.resolve(flags.config) : path.resolve("bdmg.blueprint.json");
  if (typeof flags.config === "string" && !existsSync(configPath)) throw new Error(`Config file not found: ${configPath}`);
  const config: BlueprintConfig = existsSync(configPath) ? JSON.parse(await readFile(configPath, "utf8")) : {};
  if (typeof flags.client === "string") config.project = flags.client;
  else if (process.env.BDMG_PROJECT_NAME) config.project ??= process.env.BDMG_PROJECT_NAME;
  if (process.env.BDMG_FRAMEWORK) config.framework ??= process.env.BDMG_FRAMEWORK;
  const figmaUrl = typeof flags["figma-url"] === "string" ? flags["figma-url"] : process.env.BDMG_FIGMA_URL ?? process.env.FIGMA_SOURCE_URL;
  if (figmaUrl) config.figmaUrl = figmaUrl;
  if (flags["require-assets"]) config.requireAssets = true;
  const assetsFlag = typeof flags.assets === "string" ? flags.assets : config.assets?.dir;
  const assetsDir = assetsFlag ? path.resolve(assetsFlag) : undefined;

  const [contentText, designText] = await Promise.all([readFile(contentPath, "utf8"), readFile(designPath, "utf8")]);
  const blueprint = buildBlueprint({
    content: JSON.parse(contentText),
    design: JSON.parse(designText),
    contentFile: path.relative(process.cwd(), contentPath),
    designFile: path.relative(process.cwd(), designPath),
    config,
    assetsDir,
  });

  await mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, "landing-page-blueprint.json");
  await writeFile(outputPath, JSON.stringify(blueprint, null, 2), "utf8");

  const visual = blueprint.sections.filter((s) => s.kind === "section");
  console.log(`Created ${outputPath}`);
  console.log(`Blueprint schema validation passed: ${blueprint.sections.length} content sections (${visual.length} visual), ${blueprint.design.canvas.viewports.length} viewport(s), ${blueprint.assets.length} assets.`);
  console.log(`Status: ${blueprint.validation.status}`);
  console.log("\nSection -> design mapping:");
  for (const s of blueprint.sections) {
    const m = s.designMatch;
    console.log(`  ${s.id.padEnd(34)} ${m.status === "matched" ? `${s.designNodeId}`.padEnd(8) : m.status.padEnd(8)} conf=${m.confidence.toFixed(2)}  ${m.method}`);
  }
  if (blueprint.validation.errors.length) console.error("\nErrors:", blueprint.validation.errors);
  if (blueprint.validation.warnings.length) console.warn("\nWarnings:", blueprint.validation.warnings);
  if (blueprint.validation.info.length) console.log("\nInfo:", blueprint.validation.info);
  if (blueprint.validation.status !== "valid") console.warn("\nBlueprint needs review before generation (see warnings above).");
}

main().catch((error: unknown) => {
  console.error("Blueprint creation or validation failed:", error);
  process.exitCode = 1;
});
