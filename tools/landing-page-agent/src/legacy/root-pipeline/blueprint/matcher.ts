import {
  CONTAINER_TYPES,
  area,
  isWithin,
  lowestCommonAncestor,
  type DesignIndex,
  type Entry,
} from "./design-index";
import { isGenericName, normHeading, normText, tokens } from "./text";

/**
 * Content -> design matcher.
 *
 * Figma layers are usually named "Frame" / "Auto Layout Horizontal", so layer
 * names cannot be trusted. The matcher instead anchors on the *visible text*:
 *
 *  1. every DOCX section is broken into text fragments (headings, sentences,
 *     list items, table cells, "a | b | c" runs);
 *  2. fragments are located among the Figma TEXT nodes;
 *  3. each candidate container is scored by how much of the section's text it
 *     contains (coverage) and how much of its own text the section explains
 *     (precision). Huge ancestors have low precision, title-only wrappers have
 *     low coverage, so the real section container wins;
 *  4. wrapper frames with an identical text set are "lifted" to the outermost
 *     one, which is normally the full-width band that owns the background.
 */

export type ContentBlock = {
  type: string;
  text?: string;
  level?: number;
  items?: string[];
  rows?: string[][];
  cells?: Array<Array<{ text: string }>>;
  alt?: string;
};

export type ContentGroup = {
  index: number;
  title: string;
  level: number;
  start: number;
  end: number;
  blockIndexes: number[];
  parentIndex: number | null;
  childIndexes: number[];
  parentTitles: string[];
  preamble: boolean;
};

export function groupContent(blocks: ContentBlock[]): ContentGroup[] {
  const groups: ContentGroup[] = [];
  const stack: ContentGroup[] = [];
  let current: ContentGroup | undefined;
  blocks.forEach((block, index) => {
    if (block.type === "heading") {
      const level = block.level ?? 1;
      while (stack.length && stack[stack.length - 1]!.level >= level) stack.pop();
      const parent = stack[stack.length - 1] ?? null;
      current = {
        index: groups.length,
        title: block.text ?? "",
        level,
        start: index,
        end: blocks.length,
        blockIndexes: [index],
        parentIndex: parent ? parent.index : null,
        childIndexes: [],
        parentTitles: stack.map((g) => g.title),
        preamble: false,
      };
      if (parent) parent.childIndexes.push(current.index);
      groups.push(current);
      stack.push(current);
    } else {
      if (!current) {
        current = {
          index: 0, title: "General content", level: 1, start: 0, end: blocks.length,
          blockIndexes: [], parentIndex: null, childIndexes: [], parentTitles: [], preamble: true,
        };
        groups.push(current);
      }
      current.blockIndexes.push(index);
    }
  });
  groups.forEach((group, i) => { group.end = groups[i + 1]?.start ?? blocks.length; });
  return groups;
}

// ---------------------------------------------------------------- fragments

type Fragment = { text: string; norm: string; base: number; blocks: Set<number>; title: boolean };

/** Break one run of copy into the pieces a designer would have typeset separately. */
export function splitFragments(text: string): string[] {
  const out = new Set<string>();
  const add = (value: string) => { const t = value.trim(); if (t) out.add(t); };
  add(text);
  const pieces = text.split(/\s*[|;\n]\s*|\s+[—–]\s+|(?<=[A-Za-z]{4,}[.!?])\s+(?=[A-Z$])/);
  for (const piece of pieces) {
    add(piece);
    // "Primary CTA: Try for Free" -> "Try for Free"
    const labelled = piece.match(/^[A-Za-z][A-Za-z0-9 &/\-]{0,38}:\s+(.+)$/);
    const body = labelled ? labelled[1]! : piece;
    if (labelled) add(body);
    for (const part of body.split(/,\s+/)) add(part.replace(/[.!?]+$/, ""));
  }
  return [...out];
}

function blockTexts(block: ContentBlock): string[] {
  if (block.type === "heading" || block.type === "paragraph") return block.text ? [block.text] : [];
  if (block.type === "list") return block.items ?? [];
  if (block.type === "table") {
    const cells = block.cells?.length ? block.cells.map((r) => r.map((c) => c.text)) : block.rows ?? [];
    return cells.flat().flatMap((cell) => cell.split("\n"));
  }
  return [];
}

function fragmentsFor(blocks: ContentBlock[], blockIndexes: number[]): Fragment[] {
  const map = new Map<string, Fragment>();
  for (const blockIndex of blockIndexes) {
    const block = blocks[blockIndex];
    if (!block) continue;
    const isTitle = block.type === "heading";
    for (const text of blockTexts(block)) {
      for (const piece of isTitle ? [text] : splitFragments(text)) {
        const norm = isTitle ? normHeading(piece) : normText(piece);
        if (!norm) continue;
        // "2. Site pricing" is an authoring label, not visible copy: weigh it lightly.
        const base = isTitle ? (/^\s*(?:(?:section|part)\s+)?\d+(?:\.\d+)*[.)\-:]?\s+/i.test(piece) ? 0.15 : 1) : 1;
        const existing = map.get(norm);
        if (existing) existing.blocks.add(blockIndex);
        else map.set(norm, { text: piece, norm, base, blocks: new Set([blockIndex]), title: isTitle });
      }
    }
  }
  return [...map.values()];
}

// ----------------------------------------------------------------- matching

type TextMatch = { idx: number; credit: number };

const longEnough = (norm: string) => norm.length >= 12 || norm.split(" ").length >= 3;

class TextLocator {
  private cache = new Map<string, TextMatch[]>();
  private exact = new Map<string, number[]>();
  constructor(private index: DesignIndex) {
    index.texts.forEach((t, i) => {
      const list = this.exact.get(t.norm) ?? [];
      list.push(i);
      this.exact.set(t.norm, list);
    });
  }
  find(norm: string): TextMatch[] {
    const cached = this.cache.get(norm);
    if (cached) return cached;
    const found = new Map<number, number>();
    for (const idx of this.exact.get(norm) ?? []) found.set(idx, 1);
    if (longEnough(norm)) {
      const padded = ` ${norm} `;
      this.index.texts.forEach((t, idx) => {
        if (found.has(idx)) return;
        const other = ` ${t.norm} `;
        if (other.includes(padded) || (longEnough(t.norm) && padded.includes(other))) found.set(idx, 0.9);
      });
    }
    const result = [...found].map(([idx, credit]) => ({ idx, credit })).sort((a, b) => a.idx - b.idx);
    this.cache.set(norm, result);
    return result;
  }
}

export type Alternative = { nodeId: string | null; nodeName: string; score: number };

export type SectionMatch = {
  status: "matched" | "unmatched" | "non-visual";
  method: "text-anchor" | "name+text" | "children-union" | "override" | "unmatched" | "non-visual";
  entry: Entry | null;
  /** The container before wrapper-lifting (the tightest frame holding the text). */
  innerEntry: Entry | null;
  confidence: number;
  coverage: number;
  precision: number;
  reason: string;
  alternatives: Alternative[];
  /** Direct children of the container that actually hold this section's text. */
  childNodeIds: string[];
  /** DOCX block index -> Figma TEXT node ids that carry that block's copy. */
  blockBindings: Record<number, string[]>;
  /** Copy that does not exist anywhere in this viewport's design. */
  contentNotInDesign: string[];
  notes: string[];
};

export type MatchOptions = {
  /** normalised heading or section id -> Figma node id */
  overrides?: Map<string, string>;
  ignore?: (title: string) => boolean;
  nonVisualPattern?: RegExp;
  minConfidence?: number;
};

export const DEFAULT_NON_VISUAL =
  /^(general content|source|overview|notes?|instructions?|readme|about this (document|doc)|document (info|details)|meta(data)?|internal|todo|revision|changelog|credits?)\b/;

type Scored = {
  entry: Entry; score: number; coverage: number; precision: number; nameBonus: number;
};

function evidenceFor(fragments: Fragment[], locator: TextLocator) {
  const matchable: Array<Fragment & { weight: number; matches: TextMatch[] }> = [];
  const unmatchable: Fragment[] = [];
  for (const fragment of fragments) {
    const matches = locator.find(fragment.norm);
    if (!matches.length) unmatchable.push(fragment);
    else matchable.push({ ...fragment, matches, weight: fragment.base / Math.sqrt(matches.length) });
  }
  return { matchable, unmatchable };
}

function scoreContainers(
  title: string,
  matchable: Array<Fragment & { weight: number; matches: TextMatch[] }>,
  candidates: Entry[],
  textCount: number,
): Scored[] {
  const explained = new Uint8Array(textCount);
  for (const f of matchable) for (const m of f.matches) explained[m.idx] = 1;
  const prefix = new Uint32Array(textCount + 1);
  for (let i = 0; i < textCount; i++) prefix[i + 1] = prefix[i]! + explained[i]!;
  const total = matchable.reduce((sum, f) => sum + f.weight, 0) || 1;
  const wantedTitle = normHeading(title);

  return candidates.map((entry) => {
    let covered = 0;
    for (const f of matchable) {
      let credit = 0;
      for (const m of f.matches) if (m.idx >= entry.textStart && m.idx < entry.textEnd && m.credit > credit) credit = m.credit;
      covered += credit * f.weight;
    }
    const coverage = covered / total;
    const size = entry.textEnd - entry.textStart;
    const precision = size ? (prefix[entry.textEnd]! - prefix[entry.textStart]!) / size : 0;
    const name = entry.node.name;
    const nameBonus = !isGenericName(name) && wantedTitle && (normText(name) === wantedTitle ||
      (tokens(name).length > 0 && tokens(name).every((t) => tokens(wantedTitle).includes(t)))) ? 0.15 : 0;
    return { entry, coverage, precision, nameBonus, score: coverage * Math.sqrt(precision) + nameBonus };
  });
}

/**
 * Lift to the enclosing frame while it is a pure wrapper (same copy) or only
 * adds a label's worth of text that no *other* section has claimed.
 */
function liftWrappers(
  entry: Entry,
  viewportHeight: number,
  scores: Map<Entry, Scored> | undefined,
  claimedByOthers: Array<{ start: number; end: number }>,
): Entry {
  let current = entry;
  for (;;) {
    const parent = current.parent;
    if (!parent || !parent.parent || !CONTAINER_TYPES.has(parent.node.type)) break; // never the viewport root
    if ((parent.node.bounds?.height ?? 0) >= viewportHeight * 0.85) break;
    const same = parent.textStart === current.textStart && parent.textEnd === current.textEnd;
    if (!same) {
      const a = scores?.get(current), b = scores?.get(parent);
      const extra = (parent.textEnd - parent.textStart) - (current.textEnd - current.textStart);
      const clean = Boolean(a && b && a.precision >= 0.6 && b.coverage >= a.coverage - 1e-9 && b.precision >= a.precision * 0.85 && extra <= 3);
      // text just outside `current` but inside `parent` that another section owns
      const stealing = claimedByOthers.some((c) => {
        const enclosing = c.start <= parent.textStart && c.end >= parent.textEnd; // a bigger section around both is fine
        const overlapsExtra = c.start < parent.textEnd && c.end > parent.textStart &&
          (c.start < current.textStart || c.end > current.textEnd);
        return overlapsExtra && !enclosing && !(c.start >= current.textStart && c.end <= current.textEnd);
      });
      if (!clean || stealing) break;
    }
    current = parent;
  }
  return current;
}

/** Copy missing from the design, minus heading labels and composed strings whose parts were found. */
function reportMissing(unmatchable: Fragment[], matchable: Fragment[]): string[] {
  return unmatchable
    .filter((u) => !u.title)
    .filter((u) => !matchable.some((m) => !m.title && [...m.blocks].some((b) => u.blocks.has(b)) && ` ${u.norm} `.includes(` ${m.norm} `)))
    .map((u) => u.text)
    .slice(0, 15);
}

type Prepared = {
  group: ContentGroup;
  fragments: Fragment[];
  matchable: ReturnType<typeof evidenceFor>["matchable"];
  unmatchable: Fragment[];
  ranked: Scored[];
  best: Scored | null;
  accepted: boolean;
  notes: string[];
};

export function matchSections(
  groups: ContentGroup[],
  blocks: ContentBlock[],
  index: DesignIndex,
  options: MatchOptions = {},
): SectionMatch[] {
  const locator = new TextLocator(index);
  const viewportHeight = index.root.bounds?.height ?? 1;
  const nonVisual = options.nonVisualPattern ?? DEFAULT_NON_VISUAL;
  const candidates = index.entries.filter((e) =>
    e.parent && CONTAINER_TYPES.has(e.node.type) && area(e.node) > 0 && e.textEnd > e.textStart &&
    (e.node.bounds?.height ?? 0) < viewportHeight * 0.85);

  const empty = (status: SectionMatch["status"], method: SectionMatch["method"], reason: string): SectionMatch => ({
    status, method, entry: null, innerEntry: null, confidence: 0, coverage: 0, precision: 0, reason,
    alternatives: [], childNodeIds: [], blockBindings: {}, contentNotInDesign: [], notes: [],
  });

  // ------------------------------------------------ pass 1: tightest container per section
  const prepared: Prepared[] = groups.map((group) => {
    const key = normHeading(group.title);
    let fragments = fragmentsFor(blocks, group.blockIndexes);
    let { matchable, unmatchable } = evidenceFor(fragments, locator);
    const notes: string[] = [];
    let ranked: Scored[] = [];
    const rank = () => {
      ranked = scoreContainers(group.title, matchable, candidates, index.texts.length)
        .filter((s) => s.coverage > 0)
        .sort((a, b) => b.score - a.score || area(a.entry.node) - area(b.entry.node));
    };
    if (matchable.length) rank();

    // drop blocks that clearly belong elsewhere (e.g. a page-wide label list pasted at the end)
    const first = ranked[0];
    if (first && group.blockIndexes.length > 2) {
      const outliers: number[] = [];
      for (const blockIndex of group.blockIndexes) {
        const own = matchable.filter((f) => f.blocks.has(blockIndex));
        const w = own.reduce((sum, f) => sum + f.weight, 0);
        if (!w) continue;
        let c = 0;
        for (const f of own) {
          let credit = 0;
          for (const m of f.matches) if (m.idx >= first.entry.textStart && m.idx < first.entry.textEnd) credit = Math.max(credit, m.credit);
          c += credit * f.weight;
        }
        if (c / w < 0.3) outliers.push(blockIndex);
      }
      if (outliers.length && outliers.length <= (group.blockIndexes.length - 1) / 2) {
        fragments = fragments.filter((f) => ![...f.blocks].every((b) => outliers.includes(b)));
        ({ matchable, unmatchable } = evidenceFor(fragments, locator));
        notes.push(`Ignored content block(s) ${outliers.map((o) => `content-${o + 1}`).join(", ")} when locating this section: their copy lives in a different part of the design.`);
        rank();
      }
    }

    const best = ranked[0] ?? null;
    let accepted = false;
    if (best) {
      const metaGroup = group.preamble || nonVisual.test(key);
      const ratio = fragments.length ? matchable.length / fragments.length : 0;
      accepted = best.coverage >= (metaGroup ? 0.6 : 0.35) && (!metaGroup || ratio >= 0.6);
      if (!accepted && !metaGroup) notes.push(`Best frame only covers ${(best.coverage * 100).toFixed(0)}% of this section's copy.`);
    }
    return { group, fragments, matchable, unmatchable, ranked, best, accepted, notes };
  });

  // text ranges each section owns (used to stop one section's frame swallowing another's)
  const claim = (g: number) => {
    const p = prepared[g]!;
    return p.accepted && p.best ? { start: p.best.entry.textStart, end: p.best.entry.textEnd } : null;
  };
  const related = (a: number, b: number) => {
    const chain = (g: number) => { const out = new Set<number>(); for (let x: number | null = g; x !== null; x = groups[x]!.parentIndex) out.add(x); return out; };
    return chain(a).has(b) || chain(b).has(a);
  };

  const finish = (g: number): SectionMatch => {
    const p = prepared[g]!;
    const chosen = p.best!;
    const scores = new Map(p.ranked.map((r) => [r.entry, r]));
    const others = groups.map((_, o) => (o === g || related(g, o) ? null : claim(o))).filter((c): c is { start: number; end: number } => Boolean(c));
    const lifted = liftWrappers(chosen.entry, viewportHeight, scores, others);
    const notes = [...p.notes];
    const bestOther = p.ranked.find((s) => !isWithin(s.entry, chosen.entry) && !isWithin(chosen.entry, s.entry));
    const ambiguous = Boolean(bestOther && bestOther.score >= chosen.score * 0.85);
    let confidence = 0.75 * chosen.coverage + 0.25 * Math.sqrt(chosen.precision);
    if (ambiguous) { confidence *= 0.85; notes.push("Another unrelated frame scored almost as well; confirm this mapping."); }
    confidence = Number(Math.min(1, confidence).toFixed(3));

    const blockBindings: Record<number, string[]> = {};
    const used = new Set<number>();
    for (const f of p.matchable) {
      let bestIdx = -1, bestCredit = 0;
      for (const m of f.matches) if (m.idx >= lifted.textStart && m.idx < lifted.textEnd && m.credit > bestCredit) { bestIdx = m.idx; bestCredit = m.credit; }
      if (bestIdx < 0) continue;
      used.add(bestIdx);
      const id = index.texts[bestIdx]!.entry.node.id;
      if (!id) continue;
      for (const b of f.blocks) {
        const list = (blockBindings[b] ??= []);
        if (!list.includes(id) && list.length < 24) list.push(id);
      }
    }
    const childNodeIds = index.entries
      .filter((e) => e.parent === lifted && [...used].some((i) => i >= e.textStart && i < e.textEnd))
      .map((e) => e.node.id).filter((id): id is string => Boolean(id));

    return {
      status: "matched",
      method: chosen.nameBonus > 0 ? "name+text" : "text-anchor",
      entry: lifted,
      innerEntry: lifted === chosen.entry ? null : chosen.entry,
      confidence,
      coverage: Number(chosen.coverage.toFixed(3)),
      precision: Number(chosen.precision.toFixed(3)),
      reason: `Anchored on ${p.matchable.length} matchable text fragment(s): coverage=${chosen.coverage.toFixed(2)}, precision=${chosen.precision.toFixed(2)}${chosen.nameBonus ? ", layer name agrees" : ""}${lifted !== chosen.entry ? `; lifted from ${chosen.entry.node.id} to its wrapper ${lifted.node.id}` : ""}.`,
      alternatives: p.ranked
        .filter((s) => !isWithin(s.entry, lifted) && !isWithin(lifted, s.entry)).slice(0, 5)
        .map((s) => ({ nodeId: s.entry.node.id, nodeName: s.entry.node.name, score: Number(s.score.toFixed(3)) })),
      childNodeIds,
      blockBindings,
      contentNotInDesign: reportMissing(p.unmatchable, p.matchable),
      notes,
    };
  };

  // ------------------------------------------------ pass 2: lift, combine with sub-sections
  const results: SectionMatch[] = new Array(groups.length);
  // Children appear after their parent in document order, so walk backwards.
  for (let g = groups.length - 1; g >= 0; g--) {
    const group = groups[g]!;
    const p = prepared[g]!;
    const key = normHeading(group.title);
    const overrideId = options.overrides?.get(key) ?? options.overrides?.get(String(g + 1).padStart(2, "0"));
    const overrideEntry = overrideId ? index.byId.get(overrideId) : undefined;
    if (overrideEntry) {
      results[g] = { ...empty("matched", "override", `Pinned to ${overrideId} by blueprint config.`), entry: overrideEntry, innerEntry: overrideEntry, confidence: 1, coverage: 1, precision: 1 };
      continue;
    }
    if (options.ignore?.(group.title)) {
      results[g] = empty("non-visual", "non-visual", "Listed in blueprint config `ignoreSections`.");
      continue;
    }

    const own = p.accepted && p.best ? finish(g) : null;
    const childMatches = group.childIndexes.map((c) => results[c]!).filter((m) => m.status === "matched" && m.entry);
    if (childMatches.length) {
      const nodes = [...(own?.entry ? [own.entry] : []), ...childMatches.map((m) => m.entry!)];
      let lca = lowestCommonAncestor(nodes);
      if (lca && (!lca.parent || (lca.node.bounds?.height ?? 0) >= viewportHeight * 0.85)) lca = null;
      if (lca) {
        const kids = childMatches.reduce((sum, m) => sum + m.confidence, 0) / childMatches.length;
        results[g] = {
          ...(own ?? empty("matched", "children-union", "")),
          status: "matched",
          method: "children-union",
          entry: liftWrappers(lca, viewportHeight, undefined, []),
          innerEntry: own?.entry && own.entry !== lca ? own.entry : null,
          confidence: Number(Math.min(own?.confidence ?? 1, kids * (own ? 1 : 0.95)).toFixed(3)),
          reason: `Smallest frame containing ${own ? "this section's own copy and " : ""}its ${childMatches.length} sub-section(s).`,
          notes: p.notes,
        };
        continue;
      }
      if (own) {
        own.notes.push("Sub-sections sit outside this frame (they live in a different part of the page), so only this section's own copy is mapped here.");
        results[g] = own;
        continue;
      }
    }
    if (own) { results[g] = own; continue; }

    if (group.preamble || nonVisual.test(key)) {
      results[g] = { ...empty("non-visual", "non-visual", "Document/meta content with no matching design text; not rendered on the page."),
        contentNotInDesign: p.unmatchable.map((f) => f.text).slice(0, 15) };
    } else {
      results[g] = {
        ...empty("unmatched", "unmatched", p.matchable.length
          ? "Copy was found in the design but no single frame holds enough of it."
          : "None of this section's copy exists in the design text."),
        alternatives: p.ranked.slice(0, 5).map((s) => ({ nodeId: s.entry.node.id, nodeName: s.entry.node.name, score: Number(s.score.toFixed(3)) })),
        contentNotInDesign: reportMissing(p.unmatchable, p.matchable),
        notes: p.notes,
      };
    }
  }
  return results;
}
