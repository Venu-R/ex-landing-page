import type { DesignAsset, PlanAssetRef, PlanReportItem } from "@bdmg/types";

import type { IconAsset } from "../design/render-tree.js";

export interface AssetAnalysis {
  /** imageRef -> public URL (only delivered images). */
  imageByRef: Map<string, string>;
  /** icon root node id -> delivered file. */
  iconByNodeId: Map<string, IconAsset>;
  refs: PlanAssetRef[];
  pending: DesignAsset[];
  provided: DesignAsset[];
  report: PlanReportItem[];
}

/**
 * Index the blueprint's asset manifest. Pending assets are not an error: the
 * page renders without them (transparent image boxes, empty icon slots) and the
 * report lists exactly which files the content team still has to deliver.
 */
export function analyzeAssets(assets: DesignAsset[]): AssetAnalysis {
  const imageByRef = new Map<string, string>();
  const iconByNodeId = new Map<string, IconAsset>();
  const pending: DesignAsset[] = [];
  const provided: DesignAsset[] = [];
  const report: PlanReportItem[] = [];

  for (const asset of assets) {
    if (asset.status === "provided" && asset.publicPath) {
      provided.push(asset);
      if (asset.kind === "image" && asset.imageRef) imageByRef.set(asset.imageRef, asset.publicPath);
      if (asset.kind === "icon") {
        const ids = new Set<string>([
          ...asset.figmaExport.nodeIds,
          ...asset.usages.map((u) => u.nodeId ?? "").filter(Boolean)
        ]);
        for (const id of ids) iconByNodeId.set(id, { publicPath: asset.publicPath });
      }
    } else {
      pending.push(asset);
      report.push({
        code: "asset-pending",
        message: `${asset.kind} "${asset.expectedName}" (${asset.width}x${asset.height}) is not in the assets folder yet. Expected ${asset.expectedName}.{${asset.acceptedExtensions.join(",")}}`
      });
    }
  }

  const refs: PlanAssetRef[] = assets.map((a) => ({
    id: a.id,
    expectedName: a.expectedName,
    kind: a.kind,
    status: a.status,
    publicPath: a.publicPath,
    width: a.width,
    height: a.height
  }));

  return { imageByRef, iconByNodeId, refs, pending, provided, report };
}
