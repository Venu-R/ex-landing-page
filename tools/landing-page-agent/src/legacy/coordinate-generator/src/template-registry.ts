import type { TemplateCategory } from "@bdmg/types";

export interface TemplateDefinition {
  id: string;
  category: TemplateCategory;
  description: string;
  keywords: string[];
}

export const TEMPLATE_REGISTRY: TemplateDefinition[] = [
  {
    id: "navigation-default",
    category: "navigation",
    description: "Site navigation",
    keywords: ["navigation", "navbar", "header", "menu"]
  },
  {
    id: "hero-default",
    category: "hero",
    description: "Main landing-page introduction",
    keywords: ["hero", "banner", "intro", "introduction"]
  },
  {
    id: "features-default",
    category: "features",
    description: "Features and benefits",
    keywords: ["feature", "benefit", "capabilities"]
  },
  {
    id: "pricing-default",
    category: "pricing",
    description: "Pricing plans",
    keywords: ["pricing", "plans", "subscription", "price"]
  },
  {
    id: "comparison-default",
    category: "comparison",
    description: "Product or plan comparison",
    keywords: ["comparison", "compare", "versus"]
  },
  {
    id: "testimonials-default",
    category: "testimonials",
    description: "Customer testimonials",
    keywords: ["testimonial", "reviews", "customer stories"]
  },
  {
    id: "faq-default",
    category: "faq",
    description: "Frequently asked questions",
    keywords: ["faq", "questions", "frequently asked"]
  },
  {
    id: "footer-default",
    category: "footer",
    description: "Page footer",
    keywords: ["footer", "copyright"]
  },
  {
    id: "content-default",
    category: "content",
    description: "General content section",
    keywords: []
  }
];