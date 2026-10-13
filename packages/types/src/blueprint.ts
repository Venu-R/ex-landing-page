import type { BlueprintContent } from "./content.js";
import type {
  Bounds,
  DesignAsset,
  DesignCanvas,
  DesignTokens,
  NormalizedDesignNode
} from "./design.js";

/**
 * Blueprint schema 3.x (produced by src/blueprint/build-blueprint.ts).
 *
 * Differences from 2.x:
 *  - `kind` separates visual sections from non-visual/meta ones (replaces `mappingRequired`)
 *  - `designMatch.status` + `coverage`/`precision` explain how a section was mapped
 *  - `designBand` points at the full-width band that owns the section's background
 *  - `content[].designTextNodeIds` binds DOCX copy to Figma TEXT nodes
 *  - `assets` is a manifest of images/icons that must be delivered to /public
 */
export type DesignMatchMethod =
  | "text-anchor"
  | "name+text"
  | "children-union"
  | "override"
  | "unmatched"
  | "non-visual";

export type DesignMatchStatus = "matched" | "unmatched" | "non-visual";

export interface DesignMatchAlternative {
  nodeId: string | null;
  nodeName: string;
  score: number;
}

export interface SectionDesignMatch {
  status: DesignMatchStatus;
  method: DesignMatchMethod;
  confidence: number;
  coverage: number;
  precision: number;
  reason: string;
  innerNodeId: string | null;
  childNodeIds: string[];
  alternatives: DesignMatchAlternative[];
  contentNotInDesign: string[];
}

export interface ResponsiveMatch {
  viewportNodeId: string | null;
  status: DesignMatchStatus;
  designNodeId: string | null;
  designNodeName: string | null;
  designBounds: Bounds | null;
  confidence: number;
}

export interface BlueprintSection {
  id: string;
  title: string;
  kind: "section" | "meta";
  hierarchyLevel: number;
  parentId: string | null;
  childIds: string[];
  parentTitles: string[];
  order: number;
  contentBlockIds: string[];
  content: BlueprintContent["blocks"];
  designNodeId: string | null;
  designNodeName: string | null;
  designMatch: SectionDesignMatch;
  designBounds: Bounds | null;
  designBand: {
    nodeId: string | null;
    name: string;
    bounds: Bounds | null;
  } | null;
  designSubtree: NormalizedDesignNode | null;
  responsive: Record<string, ResponsiveMatch>;
  implementationNotes: string[];
}

export interface BlueprintSource {
  contentFile: string;
  designFile: string;
  contentFilename: string;
  designFilename: string;
  designSourceUrl: string | null;
  figmaFileKey: string | null;
  figmaNodeId: string | null;
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
  info: string[];
  checks: BlueprintValidationCheck[];
}

export interface BlueprintViewport {
  breakpoint: "desktop" | "tablet" | "mobile";
  nodeId: string | null;
  name: string;
  width: number;
  height: number;
  primary: boolean;
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
    canvas: DesignCanvas & { viewports: BlueprintViewport[] };
    tokens: DesignTokens;
    document: NormalizedDesignNode;
  };

  sections: BlueprintSection[];
  assets: DesignAsset[];
  validation: BlueprintValidation;
}
