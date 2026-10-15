import path from "node:path";
import type { DesignAsset } from "@bdmg/types";
import { copyFile, exists } from "../utils/file-utils.js";

/** Copies delivered files from the assets folder into <app>/public/<basePath>. */
export async function generateAssets(
  outputDir: string,
  assets: DesignAsset[],
  assetsDir: string | null,
  basePath: string
): Promise<{ copied: number; missing: string[] }> {
  let copied = 0;
  const missing: string[] = [];
  if (!assetsDir) return { copied, missing };
  const prefix = basePath.replace(/\/$/, "");
  for (const asset of assets) {
    if (asset.status !== "provided" || !asset.publicPath) continue;
    const relative = asset.publicPath.startsWith(prefix + "/") ? asset.publicPath.slice(prefix.length + 1) : asset.publicPath.replace(/^\//, "");
    const from = path.join(assetsDir, relative);
    if (!(await exists(from))) {
      missing.push(asset.publicPath);
      continue;
    }
    await copyFile(from, path.join(outputDir, "public", prefix, relative));
    copied += 1;
  }
  return { copied, missing };
}
