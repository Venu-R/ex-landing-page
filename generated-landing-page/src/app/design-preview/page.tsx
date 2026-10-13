
import blueprint from "../../data/landing-page-blueprint.json";
import { DesignTreeRenderer } from "@bdmg/ui";
import type { NormalizedDesignNode } from "@bdmg/types";

export default function DesignPreviewPage() {
  const designDocument =
    blueprint.design.document as unknown as NormalizedDesignNode;

  const canvasWidth =
    blueprint.design.canvas?.inferredViewport?.width ??
    blueprint.design.canvas?.bounds?.width ??
    1440;

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 0",
        background: "#e5e7eb",
        overflowX: "auto",
      }}
    >
      <div
        style={{
          padding: "0 24px 20px",
          fontFamily: "Arial, sans-serif",
          color: "#111827",
        }}
      >
        <h1 style={{ fontSize: 24, margin: "0 0 8px" }}>
          Figma Design Preview
        </h1>
        <p style={{ margin: 0, color: "#4b5563" }}>
          Temporary preview of the normalized Figma design tree.
        </p>
      </div>

      <div
        style={{
          width: canvasWidth,
          minWidth: canvasWidth,
          margin: "0 auto",
          background: "#ffffff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <DesignTreeRenderer node={designDocument} />
      </div>
    </main>
  );
}
