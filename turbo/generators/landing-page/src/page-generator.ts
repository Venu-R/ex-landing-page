import type { LandingPageBlueprint } from "@bdmg/types";
import type { CliOptions } from "./config.js";
import { generateApp } from "./generators/generate-app.js";
import { generateAssets } from "./generators/generate-assets.js";
import { generatePage } from "./generators/generate-page.js";
import { generateTheme } from "./generators/generate-theme.js";
import { buildPagePlan } from "./processors/build-page.js";
import { removeDir } from "./utils/file-utils.js";

export async function generateLandingPage(blueprint: LandingPageBlueprint, options: CliOptions) {
  if (options.clean) await removeDir(options.outputDir);
  const { plan, css } = buildPagePlan(blueprint);
  await generateApp(options.outputDir, plan);
  await generateTheme(options.outputDir, css, plan.viewports);
  const files = await generatePage(options.outputDir, plan);
  const assets = await generateAssets(options.outputDir, blueprint.assets, options.assetsDir, options.assetsBasePath);
  return { plan, files, assets };
}
