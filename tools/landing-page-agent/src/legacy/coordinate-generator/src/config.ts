import path from "node:path";
import { fileURLToPath } from "node:url";

/** Repository root (turbo/generators/landing-page/src -> repo). */
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

export interface CliOptions {
  blueprintPath: string;
  outputDir: string;
  /** Folder with delivered images/icons (same folder passed to build-blueprint --assets). */
  assetsDir: string | null;
  /** URL prefix the blueprint used for delivered assets. */
  assetsBasePath: string;
  strictMappings: boolean;
  allowNeedsReview: boolean;
  clean: boolean;
}

export const DEFAULTS = {
  blueprint: "output/landing-page-blueprint.json",
  output: "generated-landing-page",
  assetsBasePath: "/assets"
} as const;

export function parseArgs(argv: string[]): CliOptions {
  const flag = (name: string): string | undefined => {
    const i = argv.indexOf(name);
    return i === -1 ? undefined : argv[i + 1];
  };
  const has = (name: string) => argv.includes(name);
  const assets = flag("--assets");
  return {
    blueprintPath: path.resolve(REPO_ROOT, flag("--blueprint") ?? DEFAULTS.blueprint),
    outputDir: path.resolve(REPO_ROOT, flag("--output") ?? DEFAULTS.output),
    assetsDir: assets ? path.resolve(REPO_ROOT, assets) : null,
    assetsBasePath: flag("--assets-base") ?? DEFAULTS.assetsBasePath,
    strictMappings: has("--strict-mappings"),
    allowNeedsReview: !has("--require-valid"),
    clean: has("--clean")
  };
}
