import type { StyleMap } from "./css.js";

const kebab = (key: string): string => {
  if (key.startsWith("--")) return key;
  const k = key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  return k.startsWith("webkit-") ? `-${k}` : k;
};

/**
 * De-duplicates visual styles into CSS classes. Many Figma nodes share the same
 * fill / type / shadow combination, so the page ends up with a readable
 * design.css instead of thousands of inline style attributes.
 */
export class SkinRegistry {
  private readonly byBody = new Map<string, string>();

  add(style: StyleMap): string | undefined {
    const keys = Object.keys(style).filter((k) => style[k] !== undefined && style[k] !== "").sort();
    if (!keys.length) return undefined;
    const body = keys.map((k) => `${kebab(k)}:${style[k]}`).join(";");
    let cls = this.byBody.get(body);
    if (!cls) {
      cls = `s${(this.byBody.size + 1).toString(36)}`;
      this.byBody.set(body, cls);
    }
    return cls;
  }

  get size(): number {
    return this.byBody.size;
  }

  css(): string {
    return [...this.byBody]
      .map(([body, cls]) => `.${cls}{${body.split(";").join(";")}}`)
      .join("\n");
  }
}
