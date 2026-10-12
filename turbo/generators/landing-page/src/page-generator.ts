import {
  copyFile,
  mkdir,
  readFile,
  writeFile
} from "node:fs/promises";
import path from "node:path";

import type {
  GenerationOptions,
  LandingPageBlueprint
} from "@bdmg/types";

import { selectTemplates } from "./template-selector.js";

export async function generatePage(
  blueprint: LandingPageBlueprint,
  options: GenerationOptions
): Promise<void> {
  const outputDir = path.resolve(options.outputDir);
  const appDir = path.join(outputDir, "src", "app");
  const dataDir = path.join(outputDir, "src", "data");

  await mkdir(appDir, { recursive: true });
  await mkdir(dataDir, { recursive: true });

  const blueprintPath = path.resolve(options.blueprintPath);

  const blueprintJson = JSON.stringify(blueprint, null, 2);
  const selections = selectTemplates(blueprint);

  await writeFile(
    path.join(dataDir, "landing-page-blueprint.json"),
    blueprintJson,
    "utf8"
  );

  await writeFile(
    path.join(dataDir, "template-selections.json"),
    JSON.stringify(selections, null, 2),
    "utf8"
  );

  const pageSource = `import blueprint from "../data/landing-page-blueprint.json";
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
`;

  await writeFile(
    path.join(appDir, "page.tsx"),
    pageSource,
    "utf8"
  );

  // Preserve the input blueprint as the authoritative generation source.
  // The JSON written above is a normalized serialization of that input.
  const check = await readFile(
    path.join(dataDir, "landing-page-blueprint.json"),
    "utf8"
  );

  JSON.parse(check);
}