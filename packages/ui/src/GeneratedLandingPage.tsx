
import type {
  LandingPageBlueprint,
  TemplateSelection
} from "@bdmg/types";

import {
  SECTION_TEMPLATES,
  type SectionTemplateCategory
} from "./templates";

import { createDesignTokenStyles } from "./design-tokens";

interface GeneratedLandingPageProps {
  blueprint: LandingPageBlueprint;
  selections: TemplateSelection[];
}

function getTemplateCategory(
  templateId: string | null | undefined
): SectionTemplateCategory {
  const category = (templateId ?? "content-default")
    .replace(/-default$/, "");

  if (category in SECTION_TEMPLATES) {
    return category as SectionTemplateCategory;
  }

  return "content";
}

export function GeneratedLandingPage({
  blueprint,
  selections
}: GeneratedLandingPageProps) {
  const selectionMap = new Map(
    selections.map((selection) => [
      selection.sectionId,
      selection
    ])
  );

  const sections = [...blueprint.sections].sort(
    (a, b) => a.order - b.order
  );

  const designStyles = createDesignTokenStyles(blueprint);

  return (
    <main
      className="generated-landing-page"
      style={designStyles}
      data-design-source={String(blueprint.design.source.format ?? "unknown")}
    >
      {sections.map((section) => {
        const selection = selectionMap.get(section.id);
        const category = getTemplateCategory(selection?.templateId);
        const Template = SECTION_TEMPLATES[category];

        return (
          <section
            key={section.id}
            id={section.id}
            className={`landing-section landing-section--${category}`}
            data-template={selection?.templateId ?? "content-default"}
            data-template-confidence={selection?.confidence ?? 0}
          >
            <div className="landing-section__inner">
              <Template section={section} />
            </div>
          </section>
        );
      })}
    </main>
  );
}
