import type { BlueprintSection } from "./blueprint.js";
import type {
  Bounds,
  NormalizedDesignNode
} from "./design.js";

export type TemplateCategory =
  | "navigation"
  | "hero"
  | "features"
  | "pricing"
  | "comparison"
  | "testimonials"
  | "faq"
  | "footer"
  | "content"
  | "custom";

export interface TemplateCapability {
  category: TemplateCategory;
  requiredContentTypes?: string[];
  supportsImages?: boolean;
  supportsNestedSections?: boolean;
  supportsResponsiveLayout?: boolean;
  description?: string;
}

export interface TemplateDefinition<
  Props = Record<string, unknown>
> {
  id: string;
  name: string;
  category: TemplateCategory;
  componentPath: string;
  capabilities: TemplateCapability[];
  defaultProps?: Partial<Props>;
  version?: string;
}

export interface TemplateSelectionCandidate {
  templateId: string;
  score: number;
  reasons: string[];
  warnings: string[];
}

export interface TemplateSelection {
  sectionId: string;
  templateId: string | null;
  confidence: number;
  alternatives: TemplateSelectionCandidate[];
  warnings: string[];
}

export interface TemplateBinding {
  contentBlockId: string;
  propPath: string;
}

export interface PlannedPageSection {
  section: BlueprintSection;
  template: TemplateDefinition | null;
  bindings: TemplateBinding[];
  props: Record<string, unknown>;
  designReference: {
    nodeId: string | null;
    bounds: Bounds | null;
    subtree: NormalizedDesignNode | null;
  };
  warnings: string[];
}