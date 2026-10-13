import { z } from "zod";

/** Zod schemas for the normalized inputs and the blueprint. Kept free of logic. */

export const ContentBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("heading"), level: z.number(), text: z.string(), html: z.string().optional() }).passthrough(),
  z.object({ type: z.literal("paragraph"), text: z.string(), html: z.string().optional(), links: z.array(z.object({ text: z.string(), href: z.string() })).optional() }).passthrough(),
  z.object({ type: z.literal("list"), ordered: z.boolean(), items: z.array(z.string()), html: z.string().optional() }).passthrough(),
  z.object({
    type: z.literal("table"),
    rows: z.array(z.array(z.string())),
    cells: z.array(z.array(z.object({ text: z.string(), html: z.string().optional(), header: z.boolean().optional(), colSpan: z.number().optional(), rowSpan: z.number().optional() }))).optional(),
    html: z.string().optional(),
  }).passthrough(),
  z.object({ type: z.literal("image"), alt: z.string(), src: z.string().nullable(), title: z.string().nullable() }).passthrough(),
]);

export const NormalizedContentSchema = z.object({
  schemaVersion: z.string(),
  source: z.object({ filename: z.string(), parser: z.string() }).passthrough(),
  blocks: z.array(ContentBlockSchema),
}).passthrough();

const BoundsSchema = z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() });

export const DesignNodeSchema: z.ZodType<any> = z.lazy(() => z.object({
  id: z.string().nullable(),
  name: z.string(),
  type: z.string(),
  text: z.string().nullable(),
  bounds: BoundsSchema.nullable(),
  children: z.array(DesignNodeSchema),
}).passthrough());

export const NormalizedDesignSchema = z.object({
  schemaVersion: z.string(),
  source: z.object({
    filename: z.string(),
    format: z.string(),
    fileName: z.string().nullable().optional(),
    lastModified: z.string().nullable().optional(),
  }).passthrough(),
  document: DesignNodeSchema,
}).passthrough();

const TableCellSchema = z.object({ text: z.string(), html: z.string().optional(), header: z.boolean().optional(), colSpan: z.number().optional(), rowSpan: z.number().optional() });

const ContentItemSchema = z.object({
  id: z.string(),
  type: z.enum(["heading", "paragraph", "list", "table", "image"]),
  text: z.string().optional(),
  level: z.number().optional(),
  ordered: z.boolean().optional(),
  items: z.array(z.string()).optional(),
  rows: z.array(z.array(z.string())).optional(),
  cells: z.array(z.array(TableCellSchema)).optional(),
  links: z.array(z.object({ text: z.string(), href: z.string() })).optional(),
  image: z.object({ alt: z.string(), src: z.string().nullable(), title: z.string().nullable() }).optional(),
  sourceBlockIndex: z.number(),
  /** Figma TEXT nodes that carry this block's copy (set on section content only). */
  designTextNodeIds: z.array(z.string()).optional(),
}).passthrough();

const MethodSchema = z.enum(["text-anchor", "name+text", "children-union", "override", "unmatched", "non-visual"]);
const AlternativeSchema = z.object({ nodeId: z.string().nullable(), nodeName: z.string(), score: z.number() });

const ResponsiveMatchSchema = z.object({
  viewportNodeId: z.string().nullable(),
  status: z.enum(["matched", "unmatched", "non-visual"]),
  designNodeId: z.string().nullable(),
  designNodeName: z.string().nullable(),
  designBounds: BoundsSchema.nullable(),
  confidence: z.number().min(0).max(1),
});

const AssetSchema = z.object({
  id: z.string(),
  kind: z.enum(["image", "icon"]),
  expectedName: z.string(),
  acceptedExtensions: z.array(z.string()),
  width: z.number(),
  height: z.number(),
  imageRef: z.string().nullable(),
  usages: z.array(z.object({
    nodeId: z.string().nullable(),
    nodeName: z.string(),
    breakpoint: z.enum(["desktop", "tablet", "mobile"]),
    role: z.enum(["background", "content", "icon"]),
    sectionId: z.string().nullable(),
    bounds: BoundsSchema.nullable(),
    contextText: z.string().nullable(),
  })),
  status: z.enum(["provided", "pending"]),
  publicPath: z.string().nullable(),
  figmaExport: z.object({ fileKey: z.string().nullable(), nodeIds: z.array(z.string()), format: z.enum(["svg", "png"]), note: z.string() }),
  aliases: z.array(z.string()),
});

export const BlueprintSchema = z.object({
  schemaVersion: z.string(),
  project: z.string(),
  framework: z.string(),
  source: z.object({
    contentFile: z.string(),
    designFile: z.string(),
    contentFilename: z.string(),
    designFilename: z.string(),
    designSourceUrl: z.string().nullable(),
    figmaFileKey: z.string().nullable(),
    figmaNodeId: z.string().nullable(),
  }),
  content: z.object({
    schemaVersion: z.string(),
    blocks: z.array(ContentItemSchema),
    headingTree: z.array(z.any()),
  }),
  design: z.object({
    schemaVersion: z.string(),
    source: z.record(z.string(), z.any()),
    canvas: z.object({
      bounds: BoundsSchema.nullable(),
      inferredViewport: z.object({ width: z.number(), height: z.number() }).nullable(),
      viewports: z.array(z.object({
        breakpoint: z.enum(["desktop", "tablet", "mobile"]),
        nodeId: z.string().nullable(),
        name: z.string(),
        width: z.number(),
        height: z.number(),
        primary: z.boolean(),
      })),
      responsiveEvidence: z.array(z.string()),
    }),
    tokens: z.object({
      colors: z.array(z.any()),
      typography: z.array(z.any()),
      spacing: z.array(z.any()),
      radii: z.array(z.any()),
      effects: z.array(z.any()),
    }),
    document: DesignNodeSchema,
  }),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    kind: z.enum(["section", "meta"]),
    hierarchyLevel: z.number(),
    parentId: z.string().nullable(),
    childIds: z.array(z.string()),
    parentTitles: z.array(z.string()).default([]),
    order: z.number(),
    contentBlockIds: z.array(z.string()),
    content: z.array(ContentItemSchema),
    designNodeId: z.string().nullable(),
    designNodeName: z.string().nullable(),
    designMatch: z.object({
      status: z.enum(["matched", "unmatched", "non-visual"]),
      method: MethodSchema,
      confidence: z.number().min(0).max(1),
      coverage: z.number().min(0).max(1),
      precision: z.number().min(0).max(1),
      reason: z.string(),
      /** Tightest frame holding the copy, when the mapped node is a wrapper around it. */
      innerNodeId: z.string().nullable(),
      /** Direct children of the mapped node that hold this section's copy (sections can share a frame). */
      childNodeIds: z.array(z.string()),
      alternatives: z.array(AlternativeSchema),
      /** Copy from the DOCX that does not appear in the design text. */
      contentNotInDesign: z.array(z.string()),
    }),
    designBounds: BoundsSchema.nullable(),
    /** Full-width band (background/layout wrapper) the section sits in. */
    designBand: z.object({ nodeId: z.string().nullable(), name: z.string(), bounds: BoundsSchema.nullable() }).nullable(),
    designSubtree: z.any().nullable(),
    responsive: z.record(z.string(), ResponsiveMatchSchema),
    implementationNotes: z.array(z.string()),
  })),
  assets: z.array(AssetSchema),
  validation: z.object({
    status: z.enum(["valid", "needs-review"]),
    errors: z.array(z.string()),
    warnings: z.array(z.string()),
    /** Non-blocking facts: pending assets, non-visual sections, missing breakpoints. */
    info: z.array(z.string()),
    checks: z.array(z.object({ name: z.string(), passed: z.boolean(), details: z.string() })),
  }),
}).strict();

export type Blueprint = z.infer<typeof BlueprintSchema>;
