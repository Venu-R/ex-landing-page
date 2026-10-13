import { z } from "zod";
import type { LandingPageBlueprint } from "@bdmg/types";

const Bounds = z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() });

/** The parts of blueprint 3.x the generator relies on. */
export const GeneratorBlueprintSchema = z
  .object({
    schemaVersion: z.string().refine((v) => v.startsWith("3."), {
      message: "Blueprint schemaVersion must be 3.x. Re-run `pnpm build:blueprint` with the updated builder."
    }),
    project: z.string(),
    source: z.object({ figmaFileKey: z.string().nullable(), designSourceUrl: z.string().nullable() }).passthrough(),
    design: z
      .object({
        canvas: z.object({
          viewports: z.array(z.object({ breakpoint: z.enum(["desktop", "tablet", "mobile"]), nodeId: z.string().nullable(), name: z.string(), width: z.number(), height: z.number(), primary: z.boolean() })).min(1)
        }).passthrough(),
        document: z.object({ children: z.array(z.any()) }).passthrough()
      })
      .passthrough(),
    sections: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        kind: z.enum(["section", "meta"]),
        designNodeId: z.string().nullable(),
        designBounds: Bounds.nullable(),
        designMatch: z.object({ status: z.enum(["matched", "unmatched", "non-visual"]), confidence: z.number(), contentNotInDesign: z.array(z.string()) }).passthrough(),
        content: z.array(z.any())
      }).passthrough()
    ),
    assets: z.array(z.any()),
    validation: z.object({ status: z.enum(["valid", "needs-review"]), errors: z.array(z.string()), warnings: z.array(z.string()) }).passthrough()
  })
  .passthrough();

export interface GateResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export function validateBlueprint(raw: unknown, opts: { strictMappings: boolean; allowNeedsReview: boolean }): GateResult & { blueprint?: LandingPageBlueprint } {
  const parsed = GeneratorBlueprintSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: [z.prettifyError(parsed.error)], warnings: [] };
  const blueprint = raw as LandingPageBlueprint;
  const errors = [...blueprint.validation.errors];
  const warnings = [...blueprint.validation.warnings];
  if (blueprint.validation.status !== "valid" && !opts.allowNeedsReview) errors.push("Blueprint status is needs-review and --require-valid was given.");
  if (opts.strictMappings) {
    const unmapped = blueprint.sections.filter((s) => s.kind === "section" && s.designMatch.status !== "matched");
    if (unmapped.length) errors.push(`Strict mapping check failed for: ${unmapped.map((s) => s.title).join(", ")}.`);
  }
  return { ok: errors.length === 0, errors, warnings, blueprint };
}
