import path from "node:path";
import { writeText } from "../utils/file-utils.js";

/** Writes the de-duplicated visual styles (one class per distinct style). */
export async function generateTheme(outputDir: string, css: string, viewports: Array<{ breakpoint: string; minWidth: number | null; maxWidth: number | null }>): Promise<string> {
  const rules = viewports.map((vp) => {
    const cls = `.bdmg-viewport--${vp.breakpoint}`;
    const parts = [vp.minWidth !== null ? `(min-width: ${vp.minWidth}px)` : "", vp.maxWidth !== null ? `(max-width: ${vp.maxWidth}px)` : ""].filter(Boolean);
    if (!parts.length) return "";
    return `${cls}{display:none}\n@media ${parts.join(" and ")}{${cls}{display:block}}`;
  });
  const file = path.join(outputDir, "src", "app", "design.css");
  await writeText(file, `/* Generated from Figma. Do not edit by hand: re-run the generator. */\n${rules.filter(Boolean).join("\n")}\n${css}\n`);
  return file;
}
