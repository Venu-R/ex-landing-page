import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseDocx } from "./content/docx.js";
import { buildSiteContent } from "./content/model.js";
import { parseFigmaUrl } from "./figma/url.js";
import { readFigmaEvidence } from "./figma/evidence.js";
import { acquireFigmaResponse } from "./figma/acquisition.js";
import { scaffoldApp } from "./project/scaffold.js";
import { slugify } from "./project/naming.js";
import { findAppDir, runLocalQa, writeQaPlaceholder } from "./qa/local.js";
import { validateGenerationInputs } from "./validation.js";

type Args = {
  command: string;
  flags: Record<string, string | true>;
};

function parseArgs(argv: string[]): Args {
  const command = argv[0]?.startsWith("--") ? "generate" : argv[0] ?? "generate";
  const rest = command === argv[0] ? argv.slice(1) : argv;
  const flags: Record<string, string | true> = {};
  for (let i = 0; i < rest.length; i++) {
    const item = rest[i]!;
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = rest[i + 1];
    if (next && !next.startsWith("--")) {
      flags[key] = next;
      i++;
    } else {
      flags[key] = true;
    }
  }
  return { command, flags };
}

function requireString(flags: Record<string, string | true>, name: string): string {
  const value = flags[name];
  if (typeof value !== "string" || !value.trim()) throw new Error(`Missing required --${name}`);
  return value;
}

async function parseCommand(flags: Record<string, string | true>, repoRoot: string) {
  const contentPath = path.resolve(repoRoot, requireString(flags, "content"));
  const parsed = await parseDocx(contentPath);
  const out = typeof flags.out === "string" ? path.resolve(repoRoot, flags.out) : path.join(repoRoot, "fixtures", "parsed-content.json");
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  console.log(`Parsed ${parsed.blocks.length} blocks -> ${out}`);
}

async function generateCommand(flags: Record<string, string | true>, repoRoot: string) {
  const contentPath = path.resolve(repoRoot, requireString(flags, "content"));
  const figmaUrl = requireString(flags, "figma-url");
  const referencePaths = [
    typeof flags["reference-desktop"] === "string" ? path.resolve(repoRoot, flags["reference-desktop"]) : null,
    typeof flags["reference-mobile"] === "string" ? path.resolve(repoRoot, flags["reference-mobile"]) : null,
    typeof flags["reference-tablet"] === "string" ? path.resolve(repoRoot, flags["reference-tablet"]) : null,
  ].filter((value): value is string => Boolean(value));
  await validateGenerationInputs({ contentPath, referencePaths }, flags["allow-unverified"] !== true);
  const figma = parseFigmaUrl(figmaUrl);
  const parsed = await parseDocx(contentPath);
  const siteContent = buildSiteContent(parsed);
  const appName = typeof flags.app === "string" ? slugify(flags.app) : slugify(siteContent.title);
  const fixtureName = path.basename(path.dirname(contentPath)) || appName;
  const figmaEvidence = typeof flags["figma-evidence"] === "string"
    ? await readFigmaEvidence(path.resolve(repoRoot, flags["figma-evidence"]))
    : (await acquireFigmaResponse({
      repoRoot,
      fixtureName,
      figma: figma,
      refresh: flags["refresh-figma"] === true,
    })).evidence;
  if (figmaEvidence && (figmaEvidence.fileKey !== figma.fileKey || (figmaEvidence.nodeId && figma.nodeId && figmaEvidence.nodeId !== figma.nodeId))) {
    throw new Error(`Figma evidence does not match --figma-url (expected ${figma.fileKey}${figma.nodeId ? ` node ${figma.nodeId}` : ""}).`);
  }
  const report = await scaffoldApp(siteContent, {
    appName,
    contentPath,
    figmaUrl: figma.url,
    repoRoot,
    force: Boolean(flags.force),
    figmaEvidence,
    requireFigmaEvidence: flags["allow-unverified"] !== true,
    referencePaths,
  });
  console.log(`Generated app: ${report.appDir}`);
  console.log(`Figma file: ${figma.fileKey}${figma.nodeId ? ` node ${figma.nodeId}` : ""}`);
  console.log(figmaEvidence
    ? `${figmaEvidence.source === "figma-api-json" ? "Saved Figma API JSON" : "Figma MCP"} evidence was reconciled into the generated report.`
    : "Important: run Figma MCP inspection or provide a valid saved/API response before claiming visual parity.");
}

async function qaCommand(flags: Record<string, string | true>, repoRoot: string) {
  const app = requireString(flags, "app");
  const appDir = await findAppDir(repoRoot, slugify(app));
  const baseUrl = typeof flags["base-url"] === "string" ? flags["base-url"] : null;
  const report = baseUrl
    ? await runLocalQa({
      appDir,
      baseUrl,
      referenceDir: typeof flags["reference-dir"] === "string" ? path.resolve(repoRoot, flags["reference-dir"]) : undefined,
      outputDir: typeof flags["output-dir"] === "string" ? path.resolve(repoRoot, flags["output-dir"]) : undefined,
      runLighthouse: Boolean(flags.lighthouse),
      visualThreshold: typeof flags["visual-threshold"] === "string" ? Number(flags["visual-threshold"]) : undefined,
      repairIterations: typeof flags["repair-iterations"] === "string" ? Number(flags["repair-iterations"]) : undefined,
    })
    : await writeQaPlaceholder(appDir);
  console.log(`Updated QA report for ${report.appName}`);
}

async function main() {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
  const { command, flags } = parseArgs(process.argv.slice(2));
  if (command === "parse") await parseCommand(flags, repoRoot);
  else if (command === "qa") await qaCommand(flags, repoRoot);
  else await generateCommand(flags, repoRoot);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
