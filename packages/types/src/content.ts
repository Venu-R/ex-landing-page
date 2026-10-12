export interface ContentLink {
  text: string;
  href: string;
}

export interface TableCell {
  text: string;
  html?: string;
  header?: boolean;
  colSpan?: number;
  rowSpan?: number;
}

export interface HeadingContentBlock {
  type: "heading";
  level: number;
  text: string;
  html?: string;
}

export interface ParagraphContentBlock {
  type: "paragraph";
  text: string;
  html?: string;
  links?: ContentLink[];
}

export interface ListContentBlock {
  type: "list";
  ordered: boolean;
  items: string[];
  html?: string;
}

export interface TableContentBlock {
  type: "table";
  rows: string[][];
  cells?: TableCell[][];
  html?: string;
}

export interface ImageContentBlock {
  type: "image";
  alt: string;
  src: string | null;
  title: string | null;
}

export type ParsedContentBlock =
  | HeadingContentBlock
  | ParagraphContentBlock
  | ListContentBlock
  | TableContentBlock
  | ImageContentBlock;

export interface NormalizedContent {
  schemaVersion: string;
  source: {
    filename: string;
    parser: string;
    warnings?: Array<{ type: string; message: string }>;
    [key: string]: unknown;
  };
  blocks: ParsedContentBlock[];
  [key: string]: unknown;
}

export interface HeadingTreeNode {
  id: string;
  title: string;
  level: number;
  sourceBlockIndex: number;
  children: HeadingTreeNode[];
}

export interface BlueprintContentItem {
  id: string;
  type: ParsedContentBlock["type"];
  sourceBlockIndex: number;
  text?: string;
  level?: number;
  ordered?: boolean;
  items?: string[];
  rows?: string[][];
  cells?: TableCell[][];
  links?: ContentLink[];
  image?: ImageContentBlock;
  sourceHtml?: string;
  tableHtml?: string;
  [key: string]: unknown;
}

export interface BlueprintContent {
  schemaVersion: string;
  blocks: BlueprintContentItem[];
  headingTree: HeadingTreeNode[];
}