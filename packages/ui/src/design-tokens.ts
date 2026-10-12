import type { CSSProperties } from "react";
import type {
  LandingPageBlueprint,
  DesignToken
} from "@bdmg/types";

type CssVariables = CSSProperties & Record<`--${string}`, string>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return value;
}

function toCssColor(paint: unknown): string | undefined {
  if (!isRecord(paint) || paint.type !== "SOLID") {
    return undefined;
  }

  const color = paint.color;

  if (!isRecord(color)) {
    return undefined;
  }

  const r = toFiniteNumber(color.r);
  const g = toFiniteNumber(color.g);
  const b = toFiniteNumber(color.b);

  if (r === undefined || g === undefined || b === undefined) {
    return undefined;
  }

  const channels = [r, g, b].map(channel =>
    Math.round(Math.min(1, Math.max(0, channel)) * 255)
  );

  const paintOpacity = toFiniteNumber(paint.opacity) ?? 1;
  const alpha = Math.min(1, Math.max(0, paintOpacity));

  if (alpha < 1) {
    return `rgba(${channels.join(", ")}, ${Number(alpha.toFixed(3))})`;
  }

  return `rgb(${channels.join(" ")})`;
}

function tokenStyle(token: DesignToken | unknown): unknown {
  if (!isRecord(token)) return undefined;
  return token.style;
}

function typographyValue(
  style: unknown,
  key: string
): unknown {
  if (!isRecord(style)) return undefined;
  return style[key];
}

function fontSizeValue(style: unknown): number | undefined {
  return toFiniteNumber(typographyValue(style, "fontSize"));
}

function fontWeightValue(style: unknown): number | undefined {
  return toFiniteNumber(typographyValue(style, "fontWeight"));
}

function fontFamilyValue(style: unknown): string | undefined {
  const family = typographyValue(style, "fontFamily");
  return typeof family === "string" && family.trim()
    ? family.trim()
    : undefined;
}

function lineHeightValue(style: unknown): number | undefined {
  return (
    toFiniteNumber(typographyValue(style, "lineHeightPx")) ??
    toFiniteNumber(typographyValue(style, "lineHeight"))
  );
}

function safeFontFamily(value: string): string {
  // Quote family names containing spaces and escape CSS-sensitive characters.
  const escaped = value.replace(/[\r\n"'\\;]/g, "");
  return `"${escaped}"`;
}

export function createDesignTokenStyles(
  blueprint: LandingPageBlueprint
): CssVariables {
  const variables: Record<string, string> = {};

  const colors = blueprint.design.tokens.colors ?? [];
  const typography = blueprint.design.tokens.typography ?? [];
  const spacing = blueprint.design.tokens.spacing ?? [];
  const radii = blueprint.design.tokens.radii ?? [];

  let colorIndex = 0;

  for (const token of colors) {
    const color = toCssColor(token.paint);

    if (!color) continue;

    colorIndex += 1;
    variables[`--bdmg-design-color-${colorIndex}`] = color;
  }

  let typographyIndex = 0;

  for (const token of typography) {
    const style = tokenStyle(token);

    const family = fontFamilyValue(style);
    const fontSize = fontSizeValue(style);
    const fontWeight = fontWeightValue(style);
    const lineHeight = lineHeightValue(style);

    const hasUsableTypography =
      family !== undefined ||
      fontSize !== undefined ||
      fontWeight !== undefined ||
      lineHeight !== undefined;

    if (!hasUsableTypography) continue;

    typographyIndex += 1;

    if (family) {
      variables[`--bdmg-design-font-family-${typographyIndex}`] =
        safeFontFamily(family);
    }

    if (fontSize !== undefined && fontSize > 0) {
      variables[`--bdmg-design-font-size-${typographyIndex}`] =
        `${fontSize}px`;
    }

    if (fontWeight !== undefined && fontWeight >= 1 && fontWeight <= 1000) {
      variables[`--bdmg-design-font-weight-${typographyIndex}`] =
        String(fontWeight);
    }

    if (lineHeight !== undefined && lineHeight > 0) {
      variables[`--bdmg-design-line-height-${typographyIndex}`] =
        `${lineHeight}px`;
    }
  }

  const uniqueSpacing = [...new Set(spacing)]
    .filter(value => Number.isFinite(value) && value >= 0)
    .sort((a, b) => a - b);

  uniqueSpacing.forEach((value, index) => {
    variables[`--bdmg-design-spacing-${index + 1}`] = `${value}px`;
  });

  const uniqueRadii = [
    ...new Set(
      radii.filter(
        (value): value is number =>
          typeof value === "number" &&
          Number.isFinite(value) &&
          value >= 0
      )
    )
  ].sort((a, b) => a - b);

  uniqueRadii.forEach((value, index) => {
    variables[`--bdmg-design-radius-${index + 1}`] = `${value}px`;
  });

  return variables as CssVariables;
}