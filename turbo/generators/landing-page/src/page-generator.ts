import {
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

  const layoutSource = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: ${JSON.stringify(blueprint.project)},
  description: "Generated with the BDMG landing-page generator."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;

  const globalCssSource = `@import "@bdmg/ui/styles/tokens.css";
@import "@bdmg/ui/styles/utilities.css";

html,
body {
  margin: 0;
  min-height: 100%;
}

body {
  font-family: Arial, Helvetica, sans-serif;
}
`;

  await writeFile(
    path.join(appDir, "page.tsx"),
    pageSource,
    "utf8"
  );

  await writeFile(
    path.join(appDir, "layout.tsx"),
    layoutSource,
    "utf8"
  );

  await writeFile(
    path.join(appDir, "globals.css"),
    globalCssSource,
    "utf8"
  );

  // Verify that the generated blueprint remains valid JSON.
  const generatedBlueprintPath = path.join(
    dataDir,
    "landing-page-blueprint.json"
  );

  const generatedBlueprint = await readFile(
    generatedBlueprintPath,
    "utf8"
  );

  JSON.parse(generatedBlueprint);

  console.log(`Generated page: ${path.join(appDir, "page.tsx")}`);
  console.log(`Generated layout: ${path.join(appDir, "layout.tsx")}`);
  console.log(`Generated styles: ${path.join(appDir, "globals.css")}`);

    const packageJson = {
    name: "generated-landing-page",
    version: "1.0.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      typecheck: "tsc --noEmit"
    },
    dependencies: {
      "@bdmg/types": "workspace:*",
      "@bdmg/ui": "workspace:*",
      next: "^15.5.0",
      react: "^19.0.0",
      "react-dom": "^19.0.0"
    },
    devDependencies: {
      "@types/node": "^22.0.0",
      "@types/react": "^19.0.0",
      "@types/react-dom": "^19.0.0",
      typescript: "~6.0.2"
    }
  };

  const tsconfig = {
    compilerOptions: {
      target: "ES2017",
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "preserve",
      incremental: true,
      plugins: [{ name: "next" }],
      paths: {
        "@/*": ["./src/*"]
      }
    },
    include: ["next-env.d.ts", ".next/types/**/*.ts", ".next/dev/types/**/*.ts", "**/*.ts", "**/*.tsx"],
    exclude: ["node_modules"]
  };

  await writeFile(
    path.join(outputDir, "package.json"),
    JSON.stringify(packageJson, null, 2),
    "utf8"
  );

  await writeFile(
    path.join(outputDir, "tsconfig.json"),
    JSON.stringify(tsconfig, null, 2),
    "utf8"
  );

  await writeFile(
    path.join(outputDir, "next-env.d.ts"),
    '/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n',
    "utf8"
  );

  await writeFile(
    path.join(outputDir, "next.config.ts"),
    'import type { NextConfig } from "next";\n\nconst nextConfig: NextConfig = {};\n\nexport default nextConfig;\n',
    "utf8"
  );

  console.log(`Generated app configuration: ${outputDir}`);
}