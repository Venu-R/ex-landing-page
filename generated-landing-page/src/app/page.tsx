import blueprint from "../data/landing-page-blueprint.json";
import selections from "../data/template-selections.json";
import { GeneratedLandingPage } from "@bdmg/ui";
import type { LandingPageBlueprint, TemplateSelection } from "@bdmg/types";

export default function GeneratedPage() {
  return (
    <GeneratedLandingPage
      blueprint={blueprint as LandingPageBlueprint}
      selections={selections as TemplateSelection[]}
    />
  );
}
