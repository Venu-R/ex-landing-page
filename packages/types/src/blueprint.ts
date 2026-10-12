import type { BlueprintContent } from "./content.js";
import type {
  Bounds,
  DesignAsset,
  DesignCanvas,
  DesignTokens,
  NormalizedDesignNode
} from "./design.js";

export type DesignMatchMethod =
  | "semantic-name"
  | "text-overlap"
  | "geometry-order"
  | "unmatched";

export interface DesignMatchAlternative {
  nodeId: string | null;
  nodeName: string;
  score: number;
}

export interface SectionDesignMatch {
  method: DesignMatchMethod;
  confidence: number;
  reason: string;
  alternatives: DesignMatchAlternative[];
}

export interface BlueprintSection {
  id: string;
  title: string;
  hierarchyLevel: number;
  parentTitles: string[];
  order: number;
  contentBlockIds: string[];
  content: BlueprintContent["blocks"];
  mappingRequired: boolean;
  designNodeId: string | null;
  designNodeName: string | null;
  designMatch: SectionDesignMatch;
  designBounds: Bounds | null;
  designSubtree: NormalizedDesignNode | null;
  implementationNotes: string[];
}

export interface BlueprintSource {
  contentFile: string;
  designFile: string;
  contentFilename: string;
  designFilename: string;
  designSourceUrl: string | null;
}

export interface BlueprintValidationCheck {
  name: string;
  passed: boolean;
  details: string;
}

export interface BlueprintValidation {
  status: "valid" | "needs-review";
  errors: string[];
  warnings: string[];
  checks: BlueprintValidationCheck[];
}

export interface LandingPageBlueprint {
  schemaVersion: string;
  project: string;
  framework: string;
  source: BlueprintSource;
  content: BlueprintContent;

  design: {
    schemaVersion: string;
    source: Record<string, unknown>;
    canvas: DesignCanvas;
    tokens: DesignTokens;
    document: NormalizedDesignNode;
  };

  sections: BlueprintSection[];
  assets: DesignAsset[];
  validation: BlueprintValidation;
}