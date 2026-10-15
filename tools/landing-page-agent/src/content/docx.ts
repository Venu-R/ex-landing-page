import mammoth from "mammoth";
import * as cheerio from "cheerio";
import { readFile } from "node:fs/promises";
import path from "node:path";

export type TableCell = {
  text: string;
  html: string;
  header: boolean;
  colSpan?: number;
  rowSpan?: number;
};

export type ContentBlock =
  | { type: "heading"; level: number; text: string; html?: string }
  | { type: "paragraph"; text: string; html?: string; links?: Array<{ text: string; href: string }> }
  | { type: "list"; ordered: boolean; items: string[]; html?: string }
  | { type: "table"; rows: string[][]; cells: TableCell[][]; html?: string }
  | { type: "image"; alt: string; src: string | null; title: string | null };

export interface ParsedDocx {
  schemaVersion: "1.0.0";
  source: {
    filename: string;
    parser: "mammoth";
    warnings: Array<{ type: string; message: string }>;
  };
  blocks: ContentBlock[];
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function listItemsFrom($: cheerio.CheerioAPI, node: cheerio.Cheerio<any>): string[] {
  return node.find("> li").map((_, item) => cleanText($(item).text())).get().filter(Boolean);
}

function textPreservingBreaks($: cheerio.CheerioAPI, node: cheerio.Cheerio<any>): string {
  const clone = node.clone();
  clone.find("br").replaceWith("\n");
  return clone
    .text()
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function linksFrom($: cheerio.CheerioAPI, node: cheerio.Cheerio<any>) {
  return node
    .find("a[href]")
    .map((_, anchor) => ({
      text: $(anchor).text().trim(),
      href: $(anchor).attr("href") ?? "",
    }))
    .get()
    .filter((link) => link.href.length > 0);
}

export async function parseDocx(inputPath: string): Promise<ParsedDocx> {
  const buffer = await readFile(inputPath);
  const result = await mammoth.convertToHtml({ buffer });
  const $ = cheerio.load(`<body>${result.value}</body>`);
  const blocks: ContentBlock[] = [];

  $("body")
    .children()
    .each((_, element) => {
      const node = $(element);
      const tag = element.tagName.toLowerCase();
      const text = cleanText(node.text());
      const html = node.toString();

      if (/^h[1-6]$/.test(tag)) {
        if (text) blocks.push({ type: "heading", level: Number(tag[1]), text, html });
      } else if (tag === "p") {
        node.find("img").each((__, image) => {
          blocks.push({
            type: "image",
            alt: $(image).attr("alt") ?? "",
            src: $(image).attr("src") ?? null,
            title: $(image).attr("title") ?? null,
          });
        });
        if (text) blocks.push({ type: "paragraph", text, html, links: linksFrom($, node) });
      } else if (tag === "ul" || tag === "ol") {
        const items = listItemsFrom($, node);
        if (items.length) blocks.push({ type: "list", ordered: tag === "ol", items, html });
      } else if (tag === "table") {
        const rows: string[][] = [];
        const cells: TableCell[][] = [];
        node
          .children("thead, tbody, tfoot")
          .add(node)
          .children("tr")
          .each((__, row) => {
            const rowCells: TableCell[] = [];
            $(row)
              .children("th, td")
              .each((___, cell) => {
                const cellNode = $(cell);
                const colSpan = Number(cellNode.attr("colspan"));
                const rowSpan = Number(cellNode.attr("rowspan"));
                rowCells.push({
                  text: textPreservingBreaks($, cellNode),
                  html: cellNode.toString(),
                  header: cell.tagName.toLowerCase() === "th",
                  ...(Number.isFinite(colSpan) && colSpan > 1 ? { colSpan } : {}),
                  ...(Number.isFinite(rowSpan) && rowSpan > 1 ? { rowSpan } : {}),
                });
              });
            if (rowCells.length) {
              cells.push(rowCells);
              rows.push(rowCells.map((cell) => cell.text));
            }
          });
        if (rows.length) blocks.push({ type: "table", rows, cells, html });
      } else if (tag === "img") {
        blocks.push({
          type: "image",
          alt: node.attr("alt") ?? "",
          src: node.attr("src") ?? null,
          title: node.attr("title") ?? null,
        });
      } else if (text) {
        blocks.push({ type: "paragraph", text, html, links: linksFrom($, node) });
      }
    });

  return {
    schemaVersion: "1.0.0",
    source: {
      filename: path.basename(inputPath),
      parser: "mammoth",
      warnings: result.messages.map((message) => ({ type: message.type, message: message.message })),
    },
    blocks,
  };
}
