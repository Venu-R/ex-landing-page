import { readJson } from "../utils/file-utils.js";
import type { CliOptions } from "../config.js";
import { validateBlueprint } from "../validators/validate-generation.js";
import type { LandingPageBlueprint } from "@bdmg/types";

export async function prepareGeneration(options: CliOptions): Promise<{ blueprint: LandingPageBlueprint; warnings: string[] }> {
  const raw = await readJson(options.blueprintPath);
  const gate = validateBlueprint(raw, { strictMappings: options.strictMappings, allowNeedsReview: options.allowNeedsReview });
  if (!gate.ok || !gate.blueprint) throw new Error(`Blueprint rejected:\n- ${gate.errors.join("\n- ")}`);
  return { blueprint: gate.blueprint, warnings: gate.warnings };
}
