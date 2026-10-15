import path from "node:path";
import type { PagePlan } from "@bdmg/types";
import { fontPackageSlug } from "../utils/naming.js";
import { writeJson, writeText } from "../utils/file-utils.js";

export function fontImports(plan: PagePlan): string[] {
  const out: string[] = [];
  for (const font of plan.fonts) {
    const slug = fontPackageSlug(font.family);
    for (const weight of font.weights) {
      out.push(`@fontsource/${slug}/${weight}.css`);
      if (font.italic) out.push(`@fontsource/${slug}/${weight}-italic.css`);
    }
  }
  return out;
}

export async function generatePage(outputDir: string, plan: PagePlan): Promise<string[]> {
  const app = path.join(outputDir, "src", "app");
  const written: string[] = [];
  const put = async (file: string, content: string) => {
    await writeText(file, content);
    written.push(file);
  };

  await writeJson(path.join(outputDir, "src", "data", "page-plan.json"), plan, false);
  await writeJson(path.join(outputDir, "src", "data", "generation-report.json"), { project: plan.project, generatedAt: plan.generatedAt, ...plan.report, assets: plan.assets });

  await put(path.join(app, "page.tsx"), `import plan from "../data/page-plan.json";
import { FigmaPage } from "@bdmg/ui";
import type { PagePlan } from "@bdmg/types";

export default function Page() {
  return <FigmaPage plan={plan as unknown as PagePlan} />;
}
`);

  const imports = fontImports(plan).map((m) => `import "${m}";`).join("\n");
  await put(path.join(app, "layout.tsx"), `import type { Metadata } from "next";
${imports}
import "@bdmg/ui/styles/page.css";
import "./design.css";
import "./globals.css";

export const metadata: Metadata = {
  title: ${JSON.stringify(plan.project)},
  description: "Generated with the BDMG landing-page generator."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`);
  await put(path.join(app, "globals.css"), `html,
body {
  margin: 0;
  padding: 0;
  background: #fff;
}
`);
  return written;
}
