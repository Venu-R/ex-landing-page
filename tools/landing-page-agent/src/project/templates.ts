import type { SiteContent } from "../content/model.js";

function json(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function packageJson(appName: string): string {
  return `${json({
    name: `@bdmg/${appName}`,
    version: "1.0.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      typecheck: "tsc --noEmit",
      lint: "tsc --noEmit",
    },
    dependencies: {
      next: "^15.5.0",
      react: "^19.0.0",
      "react-dom": "^19.0.0",
    },
    devDependencies: {
      "@types/node": "^26.6.5",
      "@types/react": "^19.0.0",
      "@types/react-dom": "^19.0.0",
      typescript: "~6.0.2",
    },
  })}\n`;
}

export function tsconfig(): string {
  return `${json({
    compilerOptions: {
      target: "ES2017",
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: false,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      noUncheckedSideEffectImports: false,
      jsx: "preserve",
      incremental: true,
      plugins: [{ name: "next" }],
      paths: { "@/*": ["./src/*"] },
    },
    include: ["next-env.d.ts", ".next/types/**/*.ts", "**/*.ts", "**/*.tsx"],
    exclude: ["node_modules"],
  })}\n`;
}

export function nextConfig(): string {
  return `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"]
  }
};

export default nextConfig;
`;
}

export function envExample(): string {
  return `# Optional deployment configuration.
# Keep secrets server-side and never commit real values.
NEXT_PUBLIC_SITE_URL=http://localhost:3000
`;
}

export function readme(appTitle: string, appName: string): string {
  return `# ${appTitle}

This is an independent, editable Next.js landing-page application generated for BigDrops Marketing.

## Development

\`\`\`bash
pnpm install
pnpm --filter @bdmg/${appName} dev
\`\`\`

## Production Build

\`\`\`bash
pnpm --filter @bdmg/${appName} build
\`\`\`

## Manual Editing

- Edit page sections in \`src/sections/\`.
- Edit shared components in \`src/components/\`.
- Edit design tokens and page styling in \`src/app/globals.css\`.
- Add static assets in \`public/assets/\`.

Future generation runs should create a new app directory unless you explicitly approve overwriting this app.

## Source evidence

- The page content is generated from the supplied DOCX.
- Figma inspection is performed through MCP by the agent, then recorded in \`generation-report.json\` and \`figma-assets.json\`.
- Missing content, unresolved links, unavailable assets, and unverified design details are reported instead of being invented.
`;
}

export function dataFile(content: SiteContent, figmaUrl: string, figmaAssets: Record<string, string> = {}): string {
  return `export type PageBlock =
  | { type: "heading"; level: number; text: string; html?: string }
  | { type: "paragraph"; text: string; html?: string; links?: Array<{ text: string; href: string }> }
  | { type: "list"; ordered: boolean; items: string[]; html?: string }
  | { type: "table"; rows: string[][]; cells?: Array<Array<{ text: string; html?: string; header?: boolean; colSpan?: number; rowSpan?: number }>>; html?: string }
  | { type: "image"; alt: string; src: string | null; title: string | null };

export type PageSection = {
  id: string;
  title: string;
  level: number;
  blocks: PageBlock[];
};

export const pageContent: {
  title: string;
  description: string;
  figmaUrl: string;
  figmaAssets: Record<string, string>;
  sections: PageSection[];
} = ${json({
    title: content.title,
    description: content.description,
    figmaUrl,
    figmaAssets,
    sections: content.sections,
  })};
`;
}
