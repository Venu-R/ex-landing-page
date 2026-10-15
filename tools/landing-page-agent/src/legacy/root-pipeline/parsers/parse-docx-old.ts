import mammoth from "mammoth";
import * as cheerio from "cheerio";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type TableCell = {
  text: string;
  html: string;
  header: boolean;
  colSpan?: number;
  rowSpan?: number;
};

type ContentBlock =
  | { type: "heading"; level: number; text: string; html?: string }
  | { type: "paragraph"; text: string; html?: string; links?: Array<{ text: string; href: string }> }
  | { type: "list"; ordered: boolean; items: string[]; html?: string }
  | { type: "table"; rows: string[][]; cells: TableCell[][]; html?: string }
  | { type: "image"; alt: string; src: string | null; title: string | null };

function linksFrom($: cheerio.CheerioAPI, node: cheerio.Cheerio<any>) {
  return node.find("a[href]").map((_, anchor) => ({
    text: $(anchor).text().trim(),
    href: $(anchor).attr("href") ?? "",
  })).get().filter((link) => link.href.length > 0);
}

/** Extract readable text without collapsing intentional line breaks in table cells. */
function textPreservingBreaks($: cheerio.CheerioAPI, node: cheerio.Cheerio<any>): string {
  const clone = node.clone();
  clone.find("br").replaceWith("\n");
  return clone.text()
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/[ \\t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

async function main(): Promise<void> {
  const inputPath = path.resolve(process.argv[2] ?? "content.docx");
  const outputDir = path.resolve(process.argv[3] ?? "output");
  await mkdir(outputDir, { recursive: true });

  const buffer = await readFile(inputPath);
  const result = await mammoth.convertToHtml({ buffer });
  const $ = cheerio.load(`<body>${result.value}</body>`);
  const blocks: ContentBlock[] = [];

  $("body").children().each((_, element) => {
    const node = $(element);
    const tag = element.tagName.toLowerCase();
    const text = cleanText(node.text());
    const html = node.toString();

    if (/^h[1-6]$/.test(tag)) {
      if (text) blocks.push({ type: "heading", level: Number(tag[1]), text, html });
    } else if (tag === "p") {
      // Preserve images as separate blocks so the renderer can account for them.
      node.find("img").each((_, image) => {
        blocks.push({
          type: "image",
          alt: $(image).attr("alt") ?? "",
          src: $(image).attr("src") ?? null,
          title: $(image).attr("title") ?? null,
        });
      });
      if (text) blocks.push({ type: "paragraph", text, html, links: linksFrom($, node) });
    } else if (tag === "ul" || tag === "ol") {
      const items = node.children("li").map((_, item) => cleanText($(item).text())).get();
      if (items.length) blocks.push({ type: "list", ordered: tag === "ol", items, html });
    } else if (tag === "table") {
      const rows: string[][] = [];
      const cells: TableCell[][] = [];
      node.children("thead, tbody, tfoot").add(node).children("tr").each((_, row) => {
        const rowNode = $(row);
        const rowCells: TableCell[] = [];
        rowNode.children("th, td").each((_, cell) => {
          const cellNode = $(cell);
          const cellText = textPreservingBreaks($, cellNode);
          const colSpan = Number(cellNode.attr("colspan"));
          const rowSpan = Number(cellNode.attr("rowspan"));
          rowCells.push({
            text: cellText,
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
      // Do not silently discard non-empty structures Mammoth may emit.
      blocks.push({ type: "paragraph", text, html, links: linksFrom($, node) });
    }
  });

  const normalized = {
    schemaVersion: "2.1.0",
    source: {
      filename: path.basename(inputPath),
      parser: "mammoth",
      warnings: result.messages.map((message) => ({ type: message.type, message: message.message })),
    },
    blocks,
  };

  const outputPath = path.join(outputDir, "normalized-content.json");
  await writeFile(outputPath, JSON.stringify(normalized, null, 2), "utf8");
  for (const message of result.messages) console.warn(`Mammoth ${message.type}: ${message.message}`);
  console.log(`Extracted ${blocks.length} content blocks.`);
  console.log(`Created ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error("DOCX parsing failed:", error);
  process.exitCode = 1;
});
