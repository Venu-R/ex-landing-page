import type { CSSProperties, ElementType } from "react";
import type { PagePlan, PlanBand, PlanNode, PlanViewport } from "@bdmg/types";

import { ViewportScaler } from "./ViewportScaler";

function NodeView({ node }: { node: PlanNode }) {
  const Tag = node.tag as ElementType;
  const common = {
    "data-figma-id": node.id,
    "data-figma-name": node.name,
    className: node.cls,
    style: node.box as CSSProperties,
    ...(node.attrs ?? {})
  };

  if (node.kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...common} src={node.src} alt={node.alt ?? ""} />;
  }

  if (node.kind === "svg" && node.svg) {
    return (
      <svg {...common} viewBox={node.svg.viewBox} xmlns="http://www.w3.org/2000/svg">
        {node.svg.paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.fill} fillRule={p.fillRule} />
        ))}
      </svg>
    );
  }

  if (node.kind === "text") {
    const content =
      typeof node.text === "string"
        ? node.text
        : (node.text ?? []).map((run, i) => (
            <span key={i} className={run.cls}>
              {run.text}
            </span>
          ));
    return (
      <Tag {...common} {...(node.href ? { href: node.href } : {})}>
        {content}
      </Tag>
    );
  }

  return (
    <Tag {...common} {...(node.href ? { href: node.href } : {})}>
      {node.children?.map((child) => <NodeView key={child.id} node={child} />)}
    </Tag>
  );
}

function Band({ band, width }: { band: PlanBand; width: number }) {
  const style: CSSProperties = {
    top: band.top,
    height: band.height,
    zIndex: band.zIndex,
    ...(band.bleedBackground ? { background: band.bleedBackground } : {}),
    ...(band.role === "loose" ? { pointerEvents: "none" } : {})
  };
  return (
    <div
      className="bdmg-band"
      style={style}
      data-band-id={band.id}
      data-band-role={band.role}
      data-sections={band.sectionIds.join(" ")}
    >
      <div className="bdmg-canvas" style={{ width, height: band.height }}>
        <NodeView node={band.root} />
      </div>
    </div>
  );
}

function Viewport({ viewport }: { viewport: PlanViewport }) {
  return (
    <div
      className={`bdmg-viewport bdmg-viewport--${viewport.breakpoint}`}
      data-design-width={viewport.designWidth}
    >
      <ViewportScaler designWidth={viewport.designWidth}>
        <div
          className="bdmg-stage"
          style={{
            minWidth: viewport.designWidth,
            height: viewport.designHeight,
            ...(viewport.background ? { background: viewport.background } : {})
          }}
        >
          {viewport.bands.map((band) => (
            <Band key={band.id} band={band} width={viewport.designWidth} />
          ))}
        </div>
      </ViewportScaler>
    </div>
  );
}

/**
 * Renders a page plan produced by the generator. The plan already contains
 * geometry, tags, classes, copy and asset URLs, so nothing here is design-specific.
 */
export function FigmaPage({ plan }: { plan: PagePlan }) {
  return (
    <main className="bdmg-page" data-project={plan.project}>
      {plan.viewports.map((viewport) => (
        <Viewport key={`${viewport.breakpoint}-${viewport.nodeId}`} viewport={viewport} />
      ))}
    </main>
  );
}
