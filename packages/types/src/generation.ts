import type { LandingPageBlueprint } from "./blueprint.js";
import type { TemplateSelection } from "./template.js";

export interface GenerationOptions {
  blueprintPath: string;
  outputDir: string;
  projectName?: string;
  overwrite?: boolean;
  strictMappings?: boolean;
  minimumMappingConfidence?: number;
  copyAssets?: boolean;
}

export interface GenerationInput {
  blueprint: LandingPageBlueprint;
  options: GenerationOptions;
}

export interface GeneratedFile {
  path: string;
  kind:
    | "page"
    | "component"
    | "style"
    | "config"
    | "asset"
    | "metadata";
  written: boolean;
}

export interface GenerationWarning {
  code: string;
  message: string;
  sectionId?: string;
  sourceNodeId?: string | null;
}

export interface GenerationReport {
  projectName: string;
  outputDir: string;
  files: GeneratedFile[];
  templateSelections: TemplateSelection[];
  warnings: GenerationWarning[];
  errors: string[];
  startedAt: string;
  completedAt: string;
  success: boolean;
}