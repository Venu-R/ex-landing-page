export type CheckStatus = "passed" | "failed" | "skipped" | "unverified";

export interface AgentCheck {
  name: string;
  status: CheckStatus;
  details: string;
}

export interface AgentReport {
  generatedAt: string;
  appName: string;
  contentFile: string;
  figmaUrl: string;
  referenceImages?: Array<{ name: string; path: string; status: CheckStatus }>;
  appDir: string;
  checks: AgentCheck[];
  warnings: string[];
  nextSteps: string[];
  reconciliation?: import("../content/model.js").Reconciliation;
  evidence?: { figmaMcp: boolean; responsiveFrames: number; assets: number; specification: string };
  visualQa?: {
    references: Array<{ viewport: string; referencePath: string | null; comparison: CheckStatus; artifactPath?: string }>;
    repairIterationsRequested: number;
    verifiedRepairIterations: number;
  };
}
