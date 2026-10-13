"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Shrinks the page when the browser is narrower than the design (the design is
 * a fixed-width layout). Wider screens keep the design at 1:1 and centre it.
 */
export function ViewportScaler({ designWidth, children }: { designWidth: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => {
      const available = document.documentElement.clientWidth || window.innerWidth;
      const scale = Math.min(1, available / designWidth);
      (el.style as CSSStyleDeclaration & { zoom: string }).zoom = scale < 1 ? String(scale) : "";
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [designWidth]);

  return <div ref={ref}>{children}</div>;
}
