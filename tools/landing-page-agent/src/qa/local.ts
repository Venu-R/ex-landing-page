import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { AxeBuilder } from "@axe-core/playwright";
import { chromium, type Browser, type Page } from "playwright";
import { PNG } from "pngjs";
import type { AgentReport } from "../reports/types.js";

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

type Viewport = { name: string; width: number; height: number };

export interface LocalQaOptions {
  appDir: string;
  baseUrl: string;
  referenceDir?: string;
  outputDir?: string;
  runLighthouse?: boolean;
  visualThreshold?: number;
  repairIterations?: number;
}

const viewports: Viewport[] = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

function check(name: string, status: "passed" | "failed" | "skipped" | "unverified", details: string) {
  return { name, status, details };
}

async function screenshot(page: Page, outputPath: string, viewport: Viewport): Promise<void> {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.screenshot({ path: outputPath, fullPage: true });
}

async function compareScreenshots(actualPath: string, referencePath: string, threshold = 0.01): Promise<string> {
  const actual = PNG.sync.read(await readFile(actualPath));
  const reference = PNG.sync.read(await readFile(referencePath));
  if (actual.width !== reference.width || actual.height !== reference.height) {
    return `failed: dimensions differ (actual ${actual.width}x${actual.height}, reference ${reference.width}x${reference.height})`;
  }
  let differentPixels = 0;
  for (let index = 0; index < actual.data.length; index += 4) {
    const difference =
      Math.abs(actual.data[index]! - reference.data[index]!) +
      Math.abs(actual.data[index + 1]! - reference.data[index + 1]!) +
      Math.abs(actual.data[index + 2]! - reference.data[index + 2]!);
    if (difference > 30) {
      differentPixels++;
    }
  }
  const ratio = differentPixels / (actual.width * actual.height);
  return ratio <= threshold
    ? `passed: ${(ratio * 100).toFixed(2)}% pixels differ`
    : `failed: ${(ratio * 100).toFixed(2)}% pixels differ (threshold ${(threshold * 100).toFixed(2)}%)`;
}

async function runLighthouse(baseUrl: string, outputPath: string): Promise<{ status: "passed" | "failed"; details: string }> {
  return await new Promise((resolve) => {
    const command = [
      "exec", "lighthouse", baseUrl, "--output=json", `--output-path=${outputPath}`,
      "--chrome-flags=--headless", "--quiet",
    ];
    const child = process.platform === "win32"
      ? spawn("cmd.exe", ["/d", "/c", "pnpm.cmd", ...command], { stdio: "ignore" })
      : spawn("pnpm", command, { stdio: "ignore" });
    child.once("error", (error) => resolve({ status: "failed", details: `Could not start Lighthouse: ${error.message}` }));
    child.once("exit", (code) => resolve(code === 0
      ? { status: "passed", details: `Lighthouse report written to ${outputPath}.` }
      : { status: "failed", details: `Lighthouse exited with code ${code ?? "unknown"}.` }));
  });
}

export async function runLocalQa(options: LocalQaOptions): Promise<AgentReport> {
  const reportPath = path.join(options.appDir, "generation-report.json");
  const report = JSON.parse(await readFile(reportPath, "utf8")) as AgentReport;
  report.checks = report.checks.filter((item) =>
    ![
      "browser navigation and links",
      "images",
      "console errors",
      "browser QA",
      "accessibility",
      "visual comparison",
      "visual comparison (desktop)",
      "visual comparison (mobile)",
      "visual repair workflow",
      "Lighthouse",
      "accessibility/performance",
    ].includes(item.name),
  );
  report.warnings = report.warnings.filter((warning) => !/LeadProsper|TrustedForm|Arohaa/i.test(warning));
  const outputDir = options.outputDir ?? path.join(options.appDir, "qa", "output");
  const referenceDir = options.referenceDir ?? path.join(options.appDir, "qa", "reference");
  const visualThreshold = options.visualThreshold ?? 0.01;
  const repairIterations = Math.max(0, Math.min(options.repairIterations ?? 0, 3));
  await mkdir(outputDir, { recursive: true });
  let browser: Browser | undefined;
  const consoleErrors: string[] = [];
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));
    await page.goto(options.baseUrl, { waitUntil: "networkidle" });
    const links = await page.locator("a").evaluateAll((anchors) =>
      anchors.map((anchor) => {
        const element = anchor as HTMLAnchorElement;
        const href = element.href;
        const target = href.startsWith("#") ? href.slice(1) : new URL(href).hash.slice(1);
        return {
          href,
          target,
          targetExists: !target || Boolean(document.getElementById(target)),
          text: element.textContent?.trim() ?? "",
        };
      }),
    );
    const images = await page.locator("img").evaluateAll((items) =>
      items.map((image) => {
        const element = image as HTMLImageElement;
        return { alt: element.getAttribute("alt"), complete: element.complete, naturalWidth: element.naturalWidth };
      }),
    );
    const brokenLinks = links.filter((link) => !link.href || !link.targetExists);
    const missingAlt = images.filter((image) => image.alt === null || (!image.complete || image.naturalWidth === 0));
    report.checks.push(check("browser navigation and links", brokenLinks.length ? "failed" : "passed",
      `${links.length} links inspected; ${brokenLinks.length} missing href or in-page targets.`));
    report.checks.push(check("images", missingAlt.length ? "failed" : "passed",
      `${images.length} images inspected; ${missingAlt.length} missing alt or failed loads.`));
    report.checks.push(check("console errors", consoleErrors.length ? "failed" : "passed",
      consoleErrors.length ? consoleErrors.join(" | ") : "No browser console errors."));

    const axeResults = await new AxeBuilder({ page }).analyze();
    report.checks.push(check("accessibility", axeResults.violations.length ? "failed" : "passed",
      axeResults.violations.length
        ? `${axeResults.violations.length} axe violations: ${axeResults.violations.map((item) =>
          `${item.id} (${item.nodes.map((node) => node.target.join(" ")).join(", ")})`).join("; ")}`
        : "No axe violations."));

    const visualReferences: Array<{ viewport: string; referencePath: string | null; comparison: "passed" | "failed" | "skipped" | "unverified"; artifactPath?: string }> = [];
    for (const viewport of viewports) {
      const actualPath = path.join(outputDir, `${viewport.name}.png`);
      await screenshot(page, actualPath, viewport);
      const referencePath = path.join(referenceDir, `${viewport.name}.png`);
      if (await exists(referencePath)) {
        const comparison = await compareScreenshots(actualPath, referencePath, visualThreshold);
        const artifactPath = path.join(outputDir, `${viewport.name}-diff.png`);
        const actual = PNG.sync.read(await readFile(actualPath));
        const reference = PNG.sync.read(await readFile(referencePath));
        if (actual.width === reference.width && actual.height === reference.height) {
          const diff = new PNG({ width: actual.width, height: actual.height });
          for (let index = 0; index < actual.data.length; index += 4) {
            const difference = Math.abs(actual.data[index]! - reference.data[index]!)
              + Math.abs(actual.data[index + 1]! - reference.data[index + 1]!)
              + Math.abs(actual.data[index + 2]! - reference.data[index + 2]!);
            const highlighted = difference > 30;
            diff.data[index] = highlighted ? 255 : actual.data[index]!;
            diff.data[index + 1] = highlighted ? 0 : actual.data[index + 1]!;
            diff.data[index + 2] = highlighted ? 0 : actual.data[index + 2]!;
            diff.data[index + 3] = 255;
          }
          await writeFile(artifactPath, PNG.sync.write(diff));
        }
        const status = comparison.startsWith("passed") ? "passed" : "failed";
        report.checks.push(check(`visual comparison (${viewport.name})`,
          status, comparison));
        visualReferences.push({ viewport: viewport.name, referencePath, comparison: status, artifactPath: await exists(artifactPath) ? artifactPath : undefined });
      } else {
        report.checks.push(check(`visual comparison (${viewport.name})`, "unverified",
          `Reference screenshot missing: ${referencePath}. Figma MCP must provide it.`));
        visualReferences.push({ viewport: viewport.name, referencePath: null, comparison: "unverified" });
      }
    }
    report.checks.push(check("visual repair workflow", repairIterations > 0 ? "unverified" : "skipped",
      repairIterations > 0
        ? `${repairIterations} bounded screenshot pass(es) configured; code repair remains an agent action between passes.`
        : "No screenshot-repair passes requested. Set --repair-iterations from 1 to 3 for bounded iterative QA."));
    report.visualQa = {
      references: visualReferences,
      repairIterationsRequested: repairIterations,
      verifiedRepairIterations: 0,
    };
  } catch (error) {
    report.checks.push(check("browser QA", "failed", error instanceof Error ? error.message : String(error)));
  } finally {
    await browser?.close();
  }
  const lighthousePath = path.join(outputDir, "lighthouse.json");
  if (options.runLighthouse) {
    const result = await runLighthouse(options.baseUrl, lighthousePath);
    report.checks.push(check("Lighthouse", result.status, result.details));
  } else {
    report.checks.push(check("Lighthouse", "skipped", "Pass --lighthouse to run the local Lighthouse audit."));
  }
  report.nextSteps = [...new Set([...report.nextSteps, `Review browser QA artifacts in ${outputDir}.`])];
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}

export async function writeQaPlaceholder(appDir: string): Promise<AgentReport> {
  const reportPath = path.join(appDir, "generation-report.json");
  const report = JSON.parse(await readFile(reportPath, "utf8")) as AgentReport;
  report.checks.push(check("local QA command", "skipped",
    "Use the QA command with --base-url to run browser checks; visual comparison requires Figma reference screenshots."));
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}

export async function findAppDir(repoRoot: string, appName: string): Promise<string> {
  const appDir = path.join(repoRoot, "apps", appName);
  if (!(await exists(appDir))) throw new Error(`App not found: ${appDir}`);
  return appDir;
}
