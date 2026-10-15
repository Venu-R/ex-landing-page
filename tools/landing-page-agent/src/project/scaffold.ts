import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DesignSpecification, FigmaEvidence, Reconciliation, SiteContent } from "../content/model.js";
import { buildDesignSpecification, reconcileContentAndDesign } from "../content/model.js";
import { slugify } from "./naming.js";
import { dataFile, envExample, nextConfig, packageJson, readme, tsconfig } from "./templates.js";
import type { AgentReport } from "../reports/types.js";
import { assetManifest, localizeFigmaAssets, type LocalizedAsset } from "../figma/evidence.js";

export interface ScaffoldOptions {
  appName?: string;
  contentPath: string;
  figmaUrl: string;
  repoRoot: string;
  force?: boolean;
  figmaEvidence?: FigmaEvidence;
  requireFigmaEvidence?: boolean;
  referencePaths?: string[];
}

async function exists(filePath: string): Promise<boolean> {
  try { await access(filePath); return true; } catch { return false; }
}

async function writeText(filePath: string, content: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
}

function sectionsFile(): string {
  return `import { pageContent } from "@/data/page-content";

type Block = (typeof pageContent.sections)[number]["blocks"][number];

function BlockView({ block }: { block: Block }) {
  if (block.type === "heading") return <h3>{block.text}</h3>;
  if (block.type === "paragraph") return <p>{block.text}</p>;
  if (block.type === "list") {
    const Tag = block.ordered ? "ol" : "ul";
    return <Tag>{block.items.map((item) => <li key={item}>{item}</li>)}</Tag>;
  }
  if (block.type === "image") {
    const key = block.src?.split("/").pop() ?? block.title ?? "";
    const src = block.src && (pageContent.figmaAssets[key] ?? block.src);
    return src ? <img src={src} alt={block.alt} /> : null;
  }
  return <div className="table-wrap"><table><tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>;
}

export function Header() {
  return <header className="site-header"><a className="brand" href="#top">{pageContent.title}</a><nav aria-label="Main navigation">{pageContent.sections.slice(0, 5).map((section) => <a key={section.id} href={\`#\${section.id}\`}>{section.title}</a>)}</nav></header>;
}

export function LandingPage() {
  return <main id="top"><h1 className="sr-only">{pageContent.title}</h1>{pageContent.sections.map((section, index) => <section className={\`section \${index === 0 ? "hero" : ""}\`} id={section.id} key={section.id}><div className="section-heading"><h2>{section.title}</h2></div><div className="section-content">{section.blocks.filter((block) => block.type !== "heading" || block.text !== section.title).map((block, blockIndex) => <BlockView block={block} key={blockIndex} />)}</div></section>)}</main>;
}

export function Footer() { return <footer className="footer"><strong>{pageContent.title}</strong></footer>; }
`;
}

function pageFile(): string {
  return `import { Footer, Header, LandingPage } from "@/sections/PageSections";

export default function Page() {
  return <><Header /><LandingPage /><Footer /></>;
}
`;
}

function layoutFile(content: SiteContent): string {
  return `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: ${JSON.stringify(content.title)},
  description: ${JSON.stringify(content.description)},
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
`;
}

function stylesFile(): string {
  return `:root{font-family:Inter,Arial,sans-serif;color:#202020;background:#fff}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.site-header{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:24px;padding:18px 5%;background:#fff;border-bottom:1px solid #eee}.brand{font-weight:700;text-decoration:none;color:inherit}.site-header nav{display:flex;gap:18px;flex:1;justify-content:center}.site-header nav a{color:#555;text-decoration:none;font-size:13px}.button{padding:10px 16px;border-radius:10px;text-decoration:none}.button-primary{color:#fff;background:#202020}.section{max-width:1100px;margin:auto;padding:96px 5%;min-height:280px}.hero{background:linear-gradient(135deg,#eef7ff,#fff5fc);max-width:none}.section-heading{max-width:760px}.eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#1769e8}.section h2{font-size:clamp(42px,7vw,84px);font-weight:400;letter-spacing:-.05em;margin:0 0 24px}.section-content{display:grid;gap:18px;max-width:900px;color:#555;line-height:1.6}.section-content h3{color:#202020;margin:12px 0 0}.section-content ul,.section-content ol{padding-left:24px}.section-content img{max-width:100%;height:auto;border-radius:16px}.table-wrap{overflow:auto}.table-wrap table{border-collapse:collapse;width:100%;min-width:520px}.table-wrap td{padding:12px;border-bottom:1px solid #e5e5e5}.footer{padding:48px 5%;background:#111;color:#fff;display:flex;justify-content:space-between;gap:20px}.footer span{color:#aaa}@media(max-width:700px){.site-header nav{display:none}.site-header{justify-content:space-between}.section{padding:64px 24px}.footer{display:grid}}
`;
}

export async function scaffoldApp(content: SiteContent, options: ScaffoldOptions): Promise<AgentReport> {
  const appName = slugify(options.appName ?? content.title);
  const appDir = path.join(options.repoRoot, "apps", appName);
  if (await exists(appDir) && !options.force) throw new Error(`App already exists: ${appDir}`);
  if (options.requireFigmaEvidence && !options.figmaEvidence) {
    throw new Error("Figma MCP evidence is required for design-accurate generation. Inspect the supplied URL with MCP and pass --figma-evidence.");
  }
  const reconciliation: Reconciliation = reconcileContentAndDesign(content, options.figmaEvidence);
  const designSpecification: DesignSpecification = buildDesignSpecification(content, options.figmaEvidence, reconciliation);
  const localizedAssets: LocalizedAsset[] = options.figmaEvidence
    ? await localizeFigmaAssets(options.figmaEvidence, path.join(appDir, "public"))
    : [];
  const figmaAssets = Object.fromEntries(
    localizedAssets
      .filter((asset) => asset.status === "localized" && asset.localPath)
      .map((asset) => [asset.name, `/${asset.localPath!.replace(/^public\//, "")}`]),
  );
  await Promise.all([
    writeText(path.join(appDir, "package.json"), packageJson(appName)),
    writeText(path.join(appDir, "tsconfig.json"), tsconfig()),
    writeText(path.join(appDir, "next.config.ts"), nextConfig()),
    writeText(path.join(appDir, "next-env.d.ts"), `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
`),
    writeText(path.join(appDir, ".env.example"), envExample()),
    writeText(path.join(appDir, "README.md"), readme(content.title, appName)),
    writeText(path.join(appDir, "src", "app", "layout.tsx"), layoutFile(content)),
    writeText(path.join(appDir, "src", "app", "page.tsx"), pageFile()),
    writeText(path.join(appDir, "src", "app", "globals.css"), stylesFile()),
    writeText(path.join(appDir, "src", "styles.d.ts"), `declare module "*.css" {
  const classes: Record<string, string>;
  export default classes;
}
`),
    writeText(path.join(appDir, "src", "sections", "PageSections.tsx"), sectionsFile()),
    writeText(path.join(appDir, "src", "data", "page-content.ts"), dataFile(content, options.figmaUrl, figmaAssets)),
    writeText(path.join(appDir, "figma-assets.json"), JSON.stringify(localizedAssets.length ? localizedAssets : (options.figmaEvidence ? assetManifest(options.figmaEvidence) : []), null, 2) + "\n"),
    writeText(path.join(appDir, "design-specification.json"), `${JSON.stringify(designSpecification, null, 2)}\n`),
  ]);
  const report: AgentReport = {
    generatedAt: new Date().toISOString(),
    appName,
    contentFile: options.contentPath,
    figmaUrl: options.figmaUrl,
    appDir,
    checks: [
      { name: "DOCX content model", status: "passed", details: `${content.blocks.length} blocks, ${content.sections.length} sections, ${content.links?.length ?? 0} links, ${content.assets?.length ?? 0} assets.` },
      { name: options.figmaEvidence?.source === "figma-api-json" ? "Figma API JSON evidence" : "Figma MCP evidence", status: options.figmaEvidence ? "passed" : "unverified", details: options.figmaEvidence ? `${options.figmaEvidence.sections.length} sections and ${options.figmaEvidence.responsiveFrames.length} responsive frames supplied.` : "MCP inspection must be performed by the agent and supplied as evidence; the deterministic CLI does not invoke MCP." },
      ...(options.figmaEvidence ? [{ name: "Figma asset localization", status: localizedAssets.some((asset) => asset.status === "failed") ? "failed" as const : "passed" as const, details: `${localizedAssets.filter((asset) => asset.status === "localized").length}/${localizedAssets.length} assets localized.` }] : []),
      { name: "content/design reconciliation", status: reconciliation.issues.some((issue) => issue.severity === "error") ? "failed" : reconciliation.issues.length ? "skipped" : "passed", details: `${reconciliation.issues.length} unresolved evidence issue(s) recorded.` },
      { name: "design specification", status: options.figmaEvidence ? "passed" : "unverified", details: `${designSpecification.sections.length} section mappings recorded; measured geometry is distinguished from unavailable values.` },
    ],
    warnings: [...reconciliation.issues.map((issue) => issue.message), ...localizedAssets.filter((asset) => asset.status === "failed").map((asset) => `Could not localize Figma asset "${asset.name}": ${asset.error}`)],
    nextSteps: ["Run typecheck and production build in the generated app.", "Run browser QA with --base-url after starting the app.", "Review every viewport comparison before claiming visual parity."],
    reconciliation,
    referenceImages: (options.referencePaths ?? []).map((referencePath) => ({ name: path.basename(referencePath), path: referencePath, status: "passed" as const })),
    evidence: { figmaMcp: options.figmaEvidence?.source === "figma-mcp", responsiveFrames: options.figmaEvidence?.responsiveFrames.length ?? 0, assets: localizedAssets.length || (options.figmaEvidence?.sections.flatMap((section) => section.assets ?? []).length ?? 0), specification: "design-specification.json" },
  };
  await writeText(path.join(appDir, "generation-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}
