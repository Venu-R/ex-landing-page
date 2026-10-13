import { pathToFileURL } from "node:url";
import path from "node:path";

import { parseArgs } from "./config.js";
import { generateLandingPage } from "./page-generator.js";
import { prepareGeneration } from "./processors/prepare-generation.js";

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const { blueprint, warnings } = await prepareGeneration(options);
  for (const w of warnings) console.warn(`blueprint warning: ${w}`);

  const { plan, assets } = await generateLandingPage(blueprint, options);
  const r = plan.report;
  console.log(`Generated "${plan.project}" -> ${options.outputDir}`);
  console.log(`  viewports: ${plan.viewports.map((v) => `${v.breakpoint} ${v.designWidth}px (${v.bands.length} bands)`).join(", ")}`);
  console.log(`  nodes: ${r.nodes} rendered, ${r.skippedNodes} skipped; ${r.textOverrides} text(s) taken from the DOCX`);
  console.log(`  fonts: ${plan.fonts.map((f) => `${f.family} ${f.weights.join("/")}`).join(", ") || "none"}`);
  console.log(`  assets: ${assets.copied} copied, ${plan.assets.filter((a) => a.status === "pending").length} pending`);
  if (r.warnings.length) {
    console.warn(`\n${r.warnings.length} warning(s):`);
    for (const w of r.warnings.slice(0, 40)) console.warn(`  [${w.code}] ${w.message}`);
    if (r.warnings.length > 40) console.warn(`  ... see ${path.join(options.outputDir, "src/data/generation-report.json")}`);
  }
}

const invoked = process.argv[1];
if (invoked && import.meta.url === pathToFileURL(path.resolve(invoked)).href) {
  main().catch((error) => {
    console.error("Landing page generation failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
