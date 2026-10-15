export type PageBlock =
  | { type: "heading"; level: number; text: string; html?: string }
  | { type: "paragraph"; text: string; html?: string; links?: Array<{ text: string; href: string }> }
  | { type: "list"; ordered: boolean; items: string[]; html?: string }
  | { type: "table"; rows: string[][]; cells?: Array<Array<{ text: string; html?: string; header?: boolean; colSpan?: number; rowSpan?: number }>>; html?: string }
  | { type: "image"; alt: string; src: string | null; title: string | null };

export type PageSection = {
  id: string;
  title: string;
  level: number;
  blocks: PageBlock[];
};

export const pageContent: {
  title: string;
  description: string;
  figmaUrl: string;
  sections: PageSection[];
} = {
  "title": "Instacart Ads — Landing Page Content",
  "description": "This document organizes the visible text from the supplied design into page sections for the landing-page generation workflow. Copy is kept faithful to the design; visual assets and layout are represented in the Figma design JSON, not in this document.",
  "figmaUrl": "https://www.figma.com/design/cvwYj73vPZRlDrL4CE47Mf/Example-landing-page-2?node-id=1-2",
  "sections": [
    {
      "id": "00-overview",
      "title": "Overview",
      "level": 1,
      "blocks": [
        {
          "type": "paragraph",
          "text": "Instacart Ads — Landing Page Content",
          "html": "<p>Instacart Ads — Landing Page Content</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Content source: Figma design JSON — Example landing page 2",
          "html": "<p><em>Content source: Figma design JSON — Example landing page 2</em></p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "This document organizes the visible text from the supplied design into page sections for the landing-page generation workflow. Copy is kept faithful to the design; visual assets and layout are represented in the Figma design JSON, not in this document.",
          "html": "<p>This document organizes the visible text from the supplied design into page sections for the landing-page generation workflow. Copy is kept faithful to the design; visual assets and layout are represented in the Figma design JSON, not in this document.</p>",
          "links": []
        }
      ]
    },
    {
      "id": "02-header-navigation",
      "title": "Header / Navigation",
      "level": 1,
      "blocks": [
        {
          "type": "heading",
          "level": 1,
          "text": "1. Header / Navigation",
          "html": "<h1>1. Header / Navigation</h1>"
        },
        {
          "type": "paragraph",
          "text": "Brand: instacart ads",
          "html": "<p><strong>Brand: </strong>instacart ads</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Navigation link: Login",
          "html": "<p><strong>Navigation link: </strong>Login</p>",
          "links": []
        }
      ]
    },
    {
      "id": "03-hero-section",
      "title": "Hero Section",
      "level": 1,
      "blocks": [
        {
          "type": "heading",
          "level": 1,
          "text": "2. Hero Section",
          "html": "<h1>2. Hero Section</h1>"
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Headline",
          "html": "<h2>Headline</h2>"
        },
        {
          "type": "paragraph",
          "text": "Advertise with Instacart",
          "html": "<p>Advertise with Instacart</p>",
          "links": []
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Supporting copy",
          "html": "<h2>Supporting copy</h2>"
        },
        {
          "type": "paragraph",
          "text": "Get in front of customers when they're searching for products like yours on Instacart.",
          "html": "<p>Get in front of customers when they're searching for products like yours on Instacart.</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Primary call to action: Start now",
          "html": "<p><strong>Primary call to action: </strong>Start now</p>",
          "links": []
        }
      ]
    },
    {
      "id": "04-the-instacart-ads-initiative",
      "title": "The Instacart Ads Initiative",
      "level": 1,
      "blocks": [
        {
          "type": "heading",
          "level": 1,
          "text": "3. The Instacart Ads Initiative",
          "html": "<h1>3. The Instacart Ads Initiative</h1>"
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Section heading",
          "html": "<h2>Section heading</h2>"
        },
        {
          "type": "paragraph",
          "text": "The Instacart Ads Initiative",
          "html": "<p>The Instacart Ads Initiative</p>",
          "links": []
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Initiative 1: Black-owned brands",
          "html": "<h2>Initiative 1: Black-owned brands</h2>"
        },
        {
          "type": "paragraph",
          "text": "If you identify as a Black-owned consumer packaged goods brand on Instacart, apply to participate in our $1 million advertising initiative",
          "html": "<p>If you identify as a Black-owned consumer packaged goods brand on Instacart, apply to participate in our $1 million advertising initiative</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Call to action: Submit here",
          "html": "<p><strong>Call to action: </strong>Submit here</p>",
          "links": []
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Initiative 2: Women-owned brands",
          "html": "<h2>Initiative 2: Women-owned brands</h2>"
        },
        {
          "type": "paragraph",
          "text": "If you identify as a women-owned consumer packaged goods brand on Instacart, apply to participate in our $1 million advertising initiative",
          "html": "<p>If you identify as a women-owned consumer packaged goods brand on Instacart, apply to participate in our $1 million advertising initiative</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Call to action: Submit here",
          "html": "<p><strong>Call to action: </strong>Submit here</p>",
          "links": []
        }
      ]
    },
    {
      "id": "05-our-marketplace",
      "title": "Our Marketplace",
      "level": 1,
      "blocks": [
        {
          "type": "heading",
          "level": 1,
          "text": "4. Our Marketplace",
          "html": "<h1>4. Our Marketplace</h1>"
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Our marketplace",
          "html": "<h2>Our marketplace</h2>"
        },
        {
          "type": "paragraph",
          "text": "Instacart is the North American leader in online grocery delivery with a marketplace spanning more than 75,000 brick and mortar stores across more than 13,000 cities in the US and Canada. Every day, busy people and families use Instacart to explore the largest grocery catalog in the world, where they can discover new products and buy the brands they love from the retailers they trust.",
          "html": "<p>Instacart is the North American leader in online grocery delivery with a marketplace spanning more than 75,000 brick and mortar stores across more than 13,000 cities in the US and Canada. Every day, busy people and families use Instacart to explore the largest grocery catalog in the world, where they can discover new products and buy the brands they love from the retailers they trust.</p>",
          "links": []
        }
      ]
    },
    {
      "id": "06-why-brands-partner-with-us",
      "title": "Why Brands Partner With Us",
      "level": 1,
      "blocks": [
        {
          "type": "heading",
          "level": 1,
          "text": "5. Why Brands Partner With Us",
          "html": "<h1>5. Why Brands Partner With Us</h1>"
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Attract customers",
          "html": "<h2>Attract customers</h2>"
        },
        {
          "type": "paragraph",
          "text": "Over 5,500 brands advertise in our marketplace to reach customers directly at the point of sale—from click, to cart, to checkout.",
          "html": "<p>Over 5,500 brands advertise in our marketplace to reach customers directly at the point of sale—from click, to cart, to checkout.</p>",
          "links": []
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Get the results that matter",
          "html": "<h2>Get the results that matter</h2>"
        },
        {
          "type": "paragraph",
          "text": "Target a range of business goals: Sales growth, Category share, Awareness.",
          "html": "<p>Target a range of business goals: Sales growth, Category share, Awareness.</p>",
          "links": []
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Unmatched scale",
          "html": "<h2>Unmatched scale</h2>"
        },
        {
          "type": "paragraph",
          "text": "Easily and conveniently claim prominent shelf space in the digital aisles of 900+ retail brands and over 75,000 stores on our platform with one campaign.",
          "html": "<p>Easily and conveniently claim prominent shelf space in the digital aisles of 900+ retail brands and over 75,000 stores on our platform with one campaign.</p>",
          "links": []
        }
      ]
    },
    {
      "id": "07-how-it-works",
      "title": "How It Works",
      "level": 1,
      "blocks": [
        {
          "type": "heading",
          "level": 1,
          "text": "6. How It Works",
          "html": "<h1>6. How It Works</h1>"
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Step 1 — Choose your products",
          "html": "<h2>Step 1 — Choose your products</h2>"
        },
        {
          "type": "paragraph",
          "text": "Choose what products to promote so they appear in prominent locations where customers are shopping",
          "html": "<p>Choose what products to promote so they appear in prominent locations where customers are shopping</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Call to action: Get started",
          "html": "<p><strong>Call to action: </strong>Get started</p>",
          "links": []
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Step 2 — Pay for performance",
          "html": "<h2>Step 2 — Pay for performance</h2>"
        },
        {
          "type": "paragraph",
          "text": "Set a budget that works for your business and only pay when users engage with your products.",
          "html": "<p>Set a budget that works for your business and only pay when users engage with your products.</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Call to action: Get started",
          "html": "<p><strong>Call to action: </strong>Get started</p>",
          "links": []
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Step 3 — Learn what works",
          "html": "<h2>Step 3 — Learn what works</h2>"
        },
        {
          "type": "paragraph",
          "text": "Once your campaign starts, review the results and optimize performance.",
          "html": "<p>Once your campaign starts, review the results and optimize performance.</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Call to action: Get started",
          "html": "<p><strong>Call to action: </strong>Get started</p>",
          "links": []
        }
      ]
    },
    {
      "id": "08-footer",
      "title": "Footer",
      "level": 1,
      "blocks": [
        {
          "type": "heading",
          "level": 1,
          "text": "7. Footer",
          "html": "<h1>7. Footer</h1>"
        },
        {
          "type": "paragraph",
          "text": "Get our latest insights and updates on the Instacart Ads blog.",
          "html": "<p>Get our latest insights and updates on the Instacart Ads blog.</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Linked text: Instacart Ads blog",
          "html": "<p><strong>Linked text: </strong>Instacart Ads blog</p>",
          "links": []
        }
      ]
    },
    {
      "id": "09-content-notes",
      "title": "Content Notes",
      "level": 1,
      "blocks": [
        {
          "type": "heading",
          "level": 1,
          "text": "Content Notes",
          "html": "<h1>Content Notes</h1>"
        },
        {
          "type": "paragraph",
          "text": "The section order follows the supplied screenshot and the text-node order in the Figma JSON. No new marketing claims or additional page copy have been added. The logo, hero photograph, marketplace illustration, benefit icons, product cards, budget graphic, and performance chart are visual assets and should be sourced from the design data/assets.",
          "html": "<p>The section order follows the supplied screenshot and the text-node order in the Figma JSON. No new marketing claims or additional page copy have been added. The logo, hero photograph, marketplace illustration, benefit icons, product cards, budget graphic, and performance chart are visual assets and should be sourced from the design data/assets.</p>",
          "links": []
        }
      ]
    }
  ]
};
