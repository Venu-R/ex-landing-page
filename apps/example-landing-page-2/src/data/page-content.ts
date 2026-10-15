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
  figmaAssets: Record<string, string>;
  sections: PageSection[];
} = {
  "title": "Source and overview",
  "description": "Purpose: preserve the visible landing-page copy in an editable document. The Figma REST response remains the source of truth for geometry, typography, colors, imagery, icons, and layout.",
  "figmaUrl": "https://www.figma.com/design/FJzE72i3SqY8FxlWrJVfHD/Example-Landing-Page?node-id=0-1&p=f&t=Th0It17xtZFI41xj-0",
  "figmaAssets": {},
  "sections": [
    {
      "id": "00-overview",
      "title": "Overview",
      "level": 1,
      "blocks": [
        {
          "type": "paragraph",
          "text": "Example Landing Page — Content Source",
          "html": "<p><strong>Example Landing Page — Content Source</strong></p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "BDMG Blueprint workflow test input",
          "html": "<p><em>BDMG Blueprint workflow test input</em></p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Purpose: preserve the visible landing-page copy in an editable document. The Figma REST response remains the source of truth for geometry, typography, colors, imagery, icons, and layout.",
          "html": "<p>Purpose: preserve the visible landing-page copy in an editable document. The Figma REST response remains the source of truth for geometry, typography, colors, imagery, icons, and layout.</p>",
          "links": []
        }
      ]
    },
    {
      "id": "02-source-and-overview",
      "title": "Source and overview",
      "level": 1,
      "blocks": [
        {
          "type": "heading",
          "level": 1,
          "text": "Source and overview",
          "html": "<h1>Source and overview</h1>"
        },
        {
          "type": "paragraph",
          "text": "Design: Example Landing Page",
          "html": "<p>Design: Example Landing Page</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Figma: https://www.figma.com/design/FJzE72i3SqY8FxlWrJVfHD/Example-Landing-Page?node-id=0-1",
          "html": "<p>Figma: https://www.figma.com/design/FJzE72i3SqY8FxlWrJVfHD/Example-Landing-Page?node-id=0-1</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Page purpose: explain Framer site plans, team-editor pricing, feature differences, and business/enterprise offerings.",
          "html": "<p>Page purpose: explain Framer site plans, team-editor pricing, feature differences, and business/enterprise offerings.</p>",
          "links": []
        }
      ]
    },
    {
      "id": "03-navigation-and-hero",
      "title": "Navigation and hero",
      "level": 1,
      "blocks": [
        {
          "type": "heading",
          "level": 1,
          "text": "1. Navigation and hero",
          "html": "<h1>1. Navigation and hero</h1>"
        },
        {
          "type": "paragraph",
          "text": "Navigation: Why Framer | Templates | Community | Resources | Awards | Business | Pricing | Publish your site for free",
          "html": "<p>Navigation: Why Framer | Templates | Community | Resources | Awards | Business | Pricing | Publish your site for free</p>",
          "links": []
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Hero",
          "html": "<h2>Hero</h2>"
        },
        {
          "type": "paragraph",
          "text": "Site Pricing",
          "html": "<p>Site Pricing</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Start building your site for free. Upgrade to unlock more features.",
          "html": "<p>Start building your site for free. Upgrade to unlock more features.</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Primary CTA: Try for Free",
          "html": "<p>Primary CTA: Try for Free</p>",
          "links": []
        }
      ]
    },
    {
      "id": "04-site-pricing",
      "title": "Site pricing",
      "level": 1,
      "blocks": [
        {
          "type": "heading",
          "level": 1,
          "text": "2. Site pricing",
          "html": "<h1>2. Site pricing</h1>"
        },
        {
          "type": "paragraph",
          "text": "Billing cadence: YEARLY. Prices are per month, per site.",
          "html": "<p>Billing cadence: YEARLY. Prices are per month, per site.</p>",
          "links": []
        },
        {
          "type": "table",
          "rows": [
            [
              "Plan",
              "Price",
              "Description",
              "Features"
            ],
            [
              "Free",
              "$0\nPer month\nPER SITE",
              "For hobby projects",
              "Design Editor\nFramer banner"
            ],
            [
              "Mini",
              "$5\nPer month\nPER SITE",
              "For landing pages",
              "Home + 404 page\nCustom domain\n1,000 visitors/mo"
            ],
            [
              "Basic",
              "$15\nPer month\nPER SITE",
              "For personal sites",
              "Unlimited pages\nPassword protect\n1 CMS collection\n10,000 visitors/mo"
            ],
            [
              "Pro",
              "$25\nPer month\nPER SITE",
              "For bigger sites",
              "Analytics\nStaging\nRedirects\n10 CMS collections\n100,000 visitors/mo"
            ]
          ],
          "cells": [
            [
              {
                "text": "Plan",
                "html": "<td><p>Plan</p></td>",
                "header": false
              },
              {
                "text": "Price",
                "html": "<td><p>Price</p></td>",
                "header": false
              },
              {
                "text": "Description",
                "html": "<td><p>Description</p></td>",
                "header": false
              },
              {
                "text": "Features",
                "html": "<td><p>Features</p></td>",
                "header": false
              }
            ],
            [
              {
                "text": "Free",
                "html": "<td><p>Free</p></td>",
                "header": false
              },
              {
                "text": "$0\nPer month\nPER SITE",
                "html": "<td><p>$0<br>Per month<br>PER SITE</p></td>",
                "header": false
              },
              {
                "text": "For hobby projects",
                "html": "<td><p>For hobby projects</p></td>",
                "header": false
              },
              {
                "text": "Design Editor\nFramer banner",
                "html": "<td><p>Design Editor<br>Framer banner</p></td>",
                "header": false
              }
            ],
            [
              {
                "text": "Mini",
                "html": "<td><p>Mini</p></td>",
                "header": false
              },
              {
                "text": "$5\nPer month\nPER SITE",
                "html": "<td><p>$5<br>Per month<br>PER SITE</p></td>",
                "header": false
              },
              {
                "text": "For landing pages",
                "html": "<td><p>For landing pages</p></td>",
                "header": false
              },
              {
                "text": "Home + 404 page\nCustom domain\n1,000 visitors/mo",
                "html": "<td><p>Home + 404 page<br>Custom domain<br>1,000 visitors/mo</p></td>",
                "header": false
              }
            ],
            [
              {
                "text": "Basic",
                "html": "<td><p>Basic</p></td>",
                "header": false
              },
              {
                "text": "$15\nPer month\nPER SITE",
                "html": "<td><p>$15<br>Per month<br>PER SITE</p></td>",
                "header": false
              },
              {
                "text": "For personal sites",
                "html": "<td><p>For personal sites</p></td>",
                "header": false
              },
              {
                "text": "Unlimited pages\nPassword protect\n1 CMS collection\n10,000 visitors/mo",
                "html": "<td><p>Unlimited pages<br>Password protect<br>1 CMS collection<br>10,000 visitors/mo</p></td>",
                "header": false
              }
            ],
            [
              {
                "text": "Pro",
                "html": "<td><p>Pro</p></td>",
                "header": false
              },
              {
                "text": "$25\nPer month\nPER SITE",
                "html": "<td><p>$25<br>Per month<br>PER SITE</p></td>",
                "header": false
              },
              {
                "text": "For bigger sites",
                "html": "<td><p>For bigger sites</p></td>",
                "header": false
              },
              {
                "text": "Analytics\nStaging\nRedirects\n10 CMS collections\n100,000 visitors/mo",
                "html": "<td><p>Analytics<br>Staging<br>Redirects<br>10 CMS collections<br>100,000 visitors/mo</p></td>",
                "header": false
              }
            ]
          ],
          "html": "<table><tbody><tr><td><p>Plan</p></td><td><p>Price</p></td><td><p>Description</p></td><td><p>Features</p></td></tr><tr><td><p>Free</p></td><td><p>$0<br>Per month<br>PER SITE</p></td><td><p>For hobby projects</p></td><td><p>Design Editor<br>Framer banner</p></td></tr><tr><td><p>Mini</p></td><td><p>$5<br>Per month<br>PER SITE</p></td><td><p>For landing pages</p></td><td><p>Home + 404 page<br>Custom domain<br>1,000 visitors/mo</p></td></tr><tr><td><p>Basic</p></td><td><p>$15<br>Per month<br>PER SITE</p></td><td><p>For personal sites</p></td><td><p>Unlimited pages<br>Password protect<br>1 CMS collection<br>10,000 visitors/mo</p></td></tr><tr><td><p>Pro</p></td><td><p>$25<br>Per month<br>PER SITE</p></td><td><p>For bigger sites</p></td><td><p>Analytics<br>Staging<br>Redirects<br>10 CMS collections<br>100,000 visitors/mo</p></td></tr></tbody></table>"
        },
        {
          "type": "paragraph",
          "text": "Each site plan includes a “Get Plan” CTA.",
          "html": "<p>Each site plan includes a “Get Plan” CTA.</p>",
          "links": []
        }
      ]
    },
    {
      "id": "05-team-pricing",
      "title": "Team pricing",
      "level": 1,
      "blocks": [
        {
          "type": "heading",
          "level": 1,
          "text": "3. Team pricing",
          "html": "<h1>3. Team pricing</h1>"
        },
        {
          "type": "paragraph",
          "text": "Team Pricing",
          "html": "<p>Team Pricing</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Optionally add editors to collaborate on paid sites.",
          "html": "<p>Optionally add editors to collaborate on paid sites.</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Team workspace benefits:",
          "html": "<p>Team workspace benefits:</p>",
          "links": []
        },
        {
          "type": "list",
          "ordered": false,
          "items": [
            "Collaborate on paid sites",
            "Custom code across team projects",
            "7 day version history",
            "Unlimited viewers"
          ],
          "html": "<ul><li>Collaborate on paid sites</li><li>Custom code across team projects</li><li>7 day version history</li><li>Unlimited viewers</li></ul>"
        },
        {
          "type": "paragraph",
          "text": "Team editors: $20 per month, per editor (YEARLY). Editors — first one is free!",
          "html": "<p>Team editors: $20 per month, per editor (YEARLY). Editors — first one is free!</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Calculator examples: Mini site — $5/mo; Basic site — $15/mo; Pro site — $25/mo.",
          "html": "<p>Calculator examples: Mini site — $5/mo; Basic site — $15/mo; Pro site — $25/mo.</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Actions: Add editors | Manage team | Cost calculator",
          "html": "<p>Actions: Add editors | Manage team | Cost calculator</p>",
          "links": []
        }
      ]
    },
    {
      "id": "06-business-plan",
      "title": "Business plan",
      "level": 1,
      "blocks": [
        {
          "type": "heading",
          "level": 1,
          "text": "4. Business plan",
          "html": "<h1>4. Business plan</h1>"
        },
        {
          "type": "paragraph",
          "text": "Business",
          "html": "<p>Business</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "When you need custom limits and app features.",
          "html": "<p>When you need custom limits and app features.</p>",
          "links": []
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Services",
          "html": "<h2>Services</h2>"
        },
        {
          "type": "list",
          "ordered": false,
          "items": [
            "Onboarding",
            "Launch support",
            "SEO & performance audit",
            "Slack channel with Framer"
          ],
          "html": "<ul><li>Onboarding</li><li>Launch support</li><li>SEO &amp; performance audit</li><li>Slack channel with Framer</li></ul>"
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Infrastructure",
          "html": "<h2>Infrastructure</h2>"
        },
        {
          "type": "list",
          "ordered": false,
          "items": [
            "No hard hosting limits",
            "Reverse proxy support",
            "Premium Infrastructure",
            "Custom application limits"
          ],
          "html": "<ul><li>No hard hosting limits</li><li>Reverse proxy support</li><li>Premium Infrastructure</li><li>Custom application limits</li></ul>"
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Legal & security",
          "html": "<h2>Legal &amp; security</h2>"
        },
        {
          "type": "list",
          "ordered": false,
          "items": [
            "Business contract",
            "Centralized yearly billing",
            "Confidentiality agreement",
            "Advanced Security"
          ],
          "html": "<ul><li>Business contract</li><li>Centralized yearly billing</li><li>Confidentiality agreement</li><li>Advanced Security</li></ul>"
        },
        {
          "type": "paragraph",
          "text": "CTA: Learn more",
          "html": "<p>CTA: Learn more</p>",
          "links": []
        }
      ]
    },
    {
      "id": "07-feature-comparison",
      "title": "Feature comparison",
      "level": 1,
      "blocks": [
        {
          "type": "heading",
          "level": 1,
          "text": "5. Feature comparison",
          "html": "<h1>5. Feature comparison</h1>"
        },
        {
          "type": "paragraph",
          "text": "Plan columns: Free, Mini, Basic, Pro, Business. The values below are readable text extracted from the design; checkmarks and other icon states must be mapped from Figma nodes rather than guessed.",
          "html": "<p>Plan columns: Free, Mini, Basic, Pro, Business. The values below are readable text extracted from the design; checkmarks and other icon states must be mapped from Figma nodes rather than guessed.</p>",
          "links": []
        },
        {
          "type": "table",
          "rows": [
            [
              "Feature",
              "Free",
              "Mini",
              "Basic",
              "Pro",
              "Business"
            ],
            [
              "Hosting — Bandwidth",
              "1 GB",
              "1 GB",
              "10 GB",
              "100 GB",
              "Custom"
            ],
            [
              "Hosting — Visitors",
              "1,000",
              "1,000",
              "10,000",
              "100,000",
              "Custom"
            ],
            [
              "Hosting — CDN",
              "Check state in Figma",
              "Basic",
              "Check state in Figma",
              "Global",
              "Premium"
            ],
            [
              "Publishing — Web pages",
              "Check state in Figma",
              "Home + 404",
              "Check state in Figma",
              "Check state in Figma",
              "Check state in Figma"
            ],
            [
              "Features — CMS items",
              "100",
              "100",
              "1,000",
              "10,000",
              "Custom"
            ],
            [
              "Features — CMS collections",
              "1",
              "1",
              "1",
              "10",
              "Custom"
            ]
          ],
          "cells": [
            [
              {
                "text": "Feature",
                "html": "<td><p>Feature</p></td>",
                "header": false
              },
              {
                "text": "Free",
                "html": "<td><p>Free</p></td>",
                "header": false
              },
              {
                "text": "Mini",
                "html": "<td><p>Mini</p></td>",
                "header": false
              },
              {
                "text": "Basic",
                "html": "<td><p>Basic</p></td>",
                "header": false
              },
              {
                "text": "Pro",
                "html": "<td><p>Pro</p></td>",
                "header": false
              },
              {
                "text": "Business",
                "html": "<td><p>Business</p></td>",
                "header": false
              }
            ],
            [
              {
                "text": "Hosting — Bandwidth",
                "html": "<td><p>Hosting — Bandwidth</p></td>",
                "header": false
              },
              {
                "text": "1 GB",
                "html": "<td><p>1 GB</p></td>",
                "header": false
              },
              {
                "text": "1 GB",
                "html": "<td><p>1 GB</p></td>",
                "header": false
              },
              {
                "text": "10 GB",
                "html": "<td><p>10 GB</p></td>",
                "header": false
              },
              {
                "text": "100 GB",
                "html": "<td><p>100 GB</p></td>",
                "header": false
              },
              {
                "text": "Custom",
                "html": "<td><p>Custom</p></td>",
                "header": false
              }
            ],
            [
              {
                "text": "Hosting — Visitors",
                "html": "<td><p>Hosting — Visitors</p></td>",
                "header": false
              },
              {
                "text": "1,000",
                "html": "<td><p>1,000</p></td>",
                "header": false
              },
              {
                "text": "1,000",
                "html": "<td><p>1,000</p></td>",
                "header": false
              },
              {
                "text": "10,000",
                "html": "<td><p>10,000</p></td>",
                "header": false
              },
              {
                "text": "100,000",
                "html": "<td><p>100,000</p></td>",
                "header": false
              },
              {
                "text": "Custom",
                "html": "<td><p>Custom</p></td>",
                "header": false
              }
            ],
            [
              {
                "text": "Hosting — CDN",
                "html": "<td><p>Hosting — CDN</p></td>",
                "header": false
              },
              {
                "text": "Check state in Figma",
                "html": "<td><p>Check state in Figma</p></td>",
                "header": false
              },
              {
                "text": "Basic",
                "html": "<td><p>Basic</p></td>",
                "header": false
              },
              {
                "text": "Check state in Figma",
                "html": "<td><p>Check state in Figma</p></td>",
                "header": false
              },
              {
                "text": "Global",
                "html": "<td><p>Global</p></td>",
                "header": false
              },
              {
                "text": "Premium",
                "html": "<td><p>Premium</p></td>",
                "header": false
              }
            ],
            [
              {
                "text": "Publishing — Web pages",
                "html": "<td><p>Publishing — Web pages</p></td>",
                "header": false
              },
              {
                "text": "Check state in Figma",
                "html": "<td><p>Check state in Figma</p></td>",
                "header": false
              },
              {
                "text": "Home + 404",
                "html": "<td><p>Home + 404</p></td>",
                "header": false
              },
              {
                "text": "Check state in Figma",
                "html": "<td><p>Check state in Figma</p></td>",
                "header": false
              },
              {
                "text": "Check state in Figma",
                "html": "<td><p>Check state in Figma</p></td>",
                "header": false
              },
              {
                "text": "Check state in Figma",
                "html": "<td><p>Check state in Figma</p></td>",
                "header": false
              }
            ],
            [
              {
                "text": "Features — CMS items",
                "html": "<td><p>Features — CMS items</p></td>",
                "header": false
              },
              {
                "text": "100",
                "html": "<td><p>100</p></td>",
                "header": false
              },
              {
                "text": "100",
                "html": "<td><p>100</p></td>",
                "header": false
              },
              {
                "text": "1,000",
                "html": "<td><p>1,000</p></td>",
                "header": false
              },
              {
                "text": "10,000",
                "html": "<td><p>10,000</p></td>",
                "header": false
              },
              {
                "text": "Custom",
                "html": "<td><p>Custom</p></td>",
                "header": false
              }
            ],
            [
              {
                "text": "Features — CMS collections",
                "html": "<td><p>Features — CMS collections</p></td>",
                "header": false
              },
              {
                "text": "1",
                "html": "<td><p>1</p></td>",
                "header": false
              },
              {
                "text": "1",
                "html": "<td><p>1</p></td>",
                "header": false
              },
              {
                "text": "1",
                "html": "<td><p>1</p></td>",
                "header": false
              },
              {
                "text": "10",
                "html": "<td><p>10</p></td>",
                "header": false
              },
              {
                "text": "Custom",
                "html": "<td><p>Custom</p></td>",
                "header": false
              }
            ]
          ],
          "html": "<table><tbody><tr><td><p>Feature</p></td><td><p>Free</p></td><td><p>Mini</p></td><td><p>Basic</p></td><td><p>Pro</p></td><td><p>Business</p></td></tr><tr><td><p>Hosting — Bandwidth</p></td><td><p>1 GB</p></td><td><p>1 GB</p></td><td><p>10 GB</p></td><td><p>100 GB</p></td><td><p>Custom</p></td></tr><tr><td><p>Hosting — Visitors</p></td><td><p>1,000</p></td><td><p>1,000</p></td><td><p>10,000</p></td><td><p>100,000</p></td><td><p>Custom</p></td></tr><tr><td><p>Hosting — CDN</p></td><td><p>Check state in Figma</p></td><td><p>Basic</p></td><td><p>Check state in Figma</p></td><td><p>Global</p></td><td><p>Premium</p></td></tr><tr><td><p>Publishing — Web pages</p></td><td><p>Check state in Figma</p></td><td><p>Home + 404</p></td><td><p>Check state in Figma</p></td><td><p>Check state in Figma</p></td><td><p>Check state in Figma</p></td></tr><tr><td><p>Features — CMS items</p></td><td><p>100</p></td><td><p>100</p></td><td><p>1,000</p></td><td><p>10,000</p></td><td><p>Custom</p></td></tr><tr><td><p>Features — CMS collections</p></td><td><p>1</p></td><td><p>1</p></td><td><p>1</p></td><td><p>10</p></td><td><p>Custom</p></td></tr></tbody></table>"
        }
      ]
    },
    {
      "id": "08-site-plans-summary",
      "title": "Site plans summary",
      "level": 1,
      "blocks": [
        {
          "type": "heading",
          "level": 1,
          "text": "6. Site plans summary",
          "html": "<h1>6. Site plans summary</h1>"
        },
        {
          "type": "table",
          "rows": [
            [
              "Plan",
              "Price"
            ],
            [
              "Free",
              "$0/mo"
            ],
            [
              "Mini",
              "$5/mo"
            ],
            [
              "Basic",
              "$15/mo"
            ],
            [
              "Pro",
              "$25/mo"
            ],
            [
              "Business",
              "Custom"
            ]
          ],
          "cells": [
            [
              {
                "text": "Plan",
                "html": "<td><p>Plan</p></td>",
                "header": false
              },
              {
                "text": "Price",
                "html": "<td><p>Price</p></td>",
                "header": false
              }
            ],
            [
              {
                "text": "Free",
                "html": "<td><p>Free</p></td>",
                "header": false
              },
              {
                "text": "$0/mo",
                "html": "<td><p>$0/mo</p></td>",
                "header": false
              }
            ],
            [
              {
                "text": "Mini",
                "html": "<td><p>Mini</p></td>",
                "header": false
              },
              {
                "text": "$5/mo",
                "html": "<td><p>$5/mo</p></td>",
                "header": false
              }
            ],
            [
              {
                "text": "Basic",
                "html": "<td><p>Basic</p></td>",
                "header": false
              },
              {
                "text": "$15/mo",
                "html": "<td><p>$15/mo</p></td>",
                "header": false
              }
            ],
            [
              {
                "text": "Pro",
                "html": "<td><p>Pro</p></td>",
                "header": false
              },
              {
                "text": "$25/mo",
                "html": "<td><p>$25/mo</p></td>",
                "header": false
              }
            ],
            [
              {
                "text": "Business",
                "html": "<td><p>Business</p></td>",
                "header": false
              },
              {
                "text": "Custom",
                "html": "<td><p>Custom</p></td>",
                "header": false
              }
            ]
          ],
          "html": "<table><tbody><tr><td><p>Plan</p></td><td><p>Price</p></td></tr><tr><td><p>Free</p></td><td><p>$0/mo</p></td></tr><tr><td><p>Mini</p></td><td><p>$5/mo</p></td></tr><tr><td><p>Basic</p></td><td><p>$15/mo</p></td></tr><tr><td><p>Pro</p></td><td><p>$25/mo</p></td></tr><tr><td><p>Business</p></td><td><p>Custom</p></td></tr></tbody></table>"
        }
      ]
    },
    {
      "id": "09-faq",
      "title": "FAQ",
      "level": 1,
      "blocks": [
        {
          "type": "heading",
          "level": 1,
          "text": "7. FAQ",
          "html": "<h1>7. FAQ</h1>"
        },
        {
          "type": "list",
          "ordered": false,
          "items": [
            "How are additional editors billed?",
            "Can I trial Framer before paying?",
            "What payment methods do you offer?",
            "Can I cancel my site plan at any time?",
            "How can I manage my invoices and charges?",
            "What is your refund policy?",
            "How are paid plans billed when moving from a Prototyping to a Site plan?"
          ],
          "html": "<ul><li>How are additional editors billed?</li><li>Can I trial Framer before paying?</li><li>What payment methods do you offer?</li><li>Can I cancel my site plan at any time?</li><li>How can I manage my invoices and charges?</li><li>What is your refund policy?</li><li>How are paid plans billed when moving from a Prototyping to a Site plan?</li></ul>"
        },
        {
          "type": "paragraph",
          "text": "FAQ answers are not present as readable copy in the supplied Figma text response. Do not invent them.",
          "html": "<p>FAQ answers are not present as readable copy in the supplied Figma text response. Do not invent them.</p>",
          "links": []
        }
      ]
    },
    {
      "id": "10-footer",
      "title": "Footer",
      "level": 1,
      "blocks": [
        {
          "type": "heading",
          "level": 1,
          "text": "8. Footer",
          "html": "<h1>8. Footer</h1>"
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Company",
          "html": "<h2>Company</h2>"
        },
        {
          "type": "paragraph",
          "text": "About | Careers | Cookies | Security | Privacy | Abuse | Charges | Terms",
          "html": "<p>About | Careers | Cookies | Security | Privacy | Abuse | Charges | Terms</p>",
          "links": []
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Product",
          "html": "<h2>Product</h2>"
        },
        {
          "type": "paragraph",
          "text": "Learn | Plugins | Awards | Agencies | Startups | Freelancers | Pricing",
          "html": "<p>Learn | Plugins | Awards | Agencies | Startups | Freelancers | Pricing</p>",
          "links": []
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Templates",
          "html": "<h2>Templates</h2>"
        },
        {
          "type": "paragraph",
          "text": "New | Free | Agency | Blog | Brand Guidelines | Changelog | Landing Page | Personal | Photography | Podcast | Portfolio | Splash Page | Startup | Web3 | 3D",
          "html": "<p>New | Free | Agency | Blog | Brand Guidelines | Changelog | Landing Page | Personal | Photography | Podcast | Portfolio | Splash Page | Startup | Web3 | 3D</p>",
          "links": []
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Resources",
          "html": "<h2>Resources</h2>"
        },
        {
          "type": "paragraph",
          "text": "Desktop Apps | Figma Plugin | Partner program | Webflow vs. Framer | Support | Updates | Community | Business | Contact",
          "html": "<p>Desktop Apps | Figma Plugin | Partner program | Webflow vs. Framer | Support | Updates | Community | Business | Contact</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Social links: Twitter | YouTube | Instagram | Dribbble",
          "html": "<p>Social links: Twitter | YouTube | Instagram | Dribbble</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Framer B.V. © 2023",
          "html": "<p>Framer B.V. © 2023</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Other visible labels: Framer | Why Framer | Templates | Community | Resources | Awards | Business | Pricing | Publish your site for free",
          "html": "<p>Other visible labels: Framer | Why Framer | Templates | Community | Resources | Awards | Business | Pricing | Publish your site for free</p>",
          "links": []
        }
      ]
    }
  ]
};
