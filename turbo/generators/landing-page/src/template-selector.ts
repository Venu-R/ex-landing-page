import type {
  LandingPageBlueprint,
  TemplateSelection
} from "@bdmg/types";

import { TEMPLATE_REGISTRY } from "./template-registry.js";

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function inferCategory(title: string): string {
  const value = normalize(title);

  const rules = [
    {
      category: "navigation",
      keywords: ["navigation", "navbar", "header", "menu"]
    },
    {
      category: "hero",
      keywords: ["hero", "banner", "introduction", "welcome"]
    },
    {
      category: "pricing",
      keywords: ["pricing", "plans", "subscription", "price"]
    },
    {
      category: "comparison",
      keywords: ["comparison", "compare", "versus"]
    },
    {
      category: "testimonials",
      keywords: ["testimonial", "reviews", "customer stories"]
    },
    {
      category: "faq",
      keywords: ["faq", "frequently asked questions"]
    },
    {
      category: "footer",
      keywords: ["footer", "copyright"]
    },
    {
      category: "features",
      keywords: ["features", "benefits", "capabilities"]
    }
  ];

  for (const rule of rules) {
    if (
      rule.keywords.some(keyword =>
        value.includes(normalize(keyword))
      )
    ) {
      return rule.category;
    }
  }

  return "content";
}

export function selectTemplates(
  blueprint: LandingPageBlueprint
): TemplateSelection[] {
  const sections = [...blueprint.sections].sort(
    (a, b) => a.order - b.order
  );

  return sections.map((section, index) => {
    const inferred = inferCategory(section.title);

    // Prefer the first and last page sections as navigation/footer only
    // when their titles provide evidence for those roles.
    const template =
      TEMPLATE_REGISTRY.find(item => item.category === inferred) ??
      TEMPLATE_REGISTRY.find(item => item.category === "content")!;

    const confidence =
      inferred === "content"
        ? 0.45
        : 0.8;

    return {
      sectionId: section.id,
      templateId: template.id,
      confidence,
      alternatives: TEMPLATE_REGISTRY
        .filter(item => item.id !== template.id)
        .slice(0, 3)
        .map(item => ({
          templateId: item.id,
          score: 0,
          reasons: ["Alternative template"],
          warnings: []
        })),
      warnings: [
        ...(section.mappingRequired && !section.designNodeId
          ? ["The section has no mapped Figma design node."]
          : []),
        ...(confidence < 0.6
          ? ["The template was selected using a generic fallback."]
          : []),
        ...(index < 0 ? ["Unreachable section index."] : [])
      ]
    };
  });
}