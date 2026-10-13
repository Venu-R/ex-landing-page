import path from "node:path";
import type { PagePlan } from "@bdmg/types";
import { fontPackageSlug } from "../utils/naming.js";
import { writeJson, writeText } from "../utils/file-utils.js";

export async function generateApp(outputDir: string, plan: PagePlan): Promise<void> {
  const fontDeps = Object.fromEntries(plan.fonts.map((f) => [`@fontsource/${fontPackageSlug(f.family)}`, "^5.0.0"]));
  await writeJson(path.join(outputDir, "package.json"), {
    name: "generated-landing-page",
    version: "1.0.0",
    private: true,
    scripts: { dev: "next dev", build: "next build", start: "next start", typecheck: "tsc --noEmit" },
    dependencies: { "@bdmg/types": "workspace:*", "@bdmg/ui": "workspace:*", next: "^15.5.0", react: "^19.0.0", "react-dom": "^19.0.0", ...fontDeps },
    devDependencies: { "@types/node": "^22.0.0", "@types/react": "^19.0.0", "@types/react-dom": "^19.0.0", typescript: "~6.0.2" }
  });
  await writeJson(path.join(outputDir, "tsconfig.json"), {
    compilerOptions: {
      target: "ES2017", lib: ["dom", "dom.iterable", "esnext"], allowJs: true, skipLibCheck: true, strict: true, noEmit: true,
      esModuleInterop: true, module: "esnext", moduleResolution: "bundler", resolveJsonModule: true, isolatedModules: true,
      jsx: "preserve", incremental: true, plugins: [{ name: "next" }], paths: { "@/*": ["./src/*"] }
    },
    include: ["next-env.d.ts", ".next/types/**/*.ts", "**/*.ts", "**/*.tsx"],
    exclude: ["node_modules"]
  });
  await writeText(path.join(outputDir, "next-env.d.ts"), '/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n');
  await writeText(path.join(outputDir, "next.config.ts"), 'import type { NextConfig } from "next";\n\nconst nextConfig: NextConfig = {\n  transpilePackages: ["@bdmg/ui", "@bdmg/types"]\n};\n\nexport default nextConfig;\n');
  await writeText(path.join(outputDir, "src", "types", "styles.d.ts"), 'declare module "*.css";\n');
}
