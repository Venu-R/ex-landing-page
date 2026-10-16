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
  "title": "Header",
  "description": "Agent instructions: Use this document as the textual content source. Use the separately supplied Marketly.png screenshot and Figma design URL for visual structure, spacing, colors, typography, background patterns, icons, and responsive behavior. Preserve visible wording and order. Do not invent missing link destinations, functionality, or additional marketing claims.",
  "figmaUrl": "https://www.figma.com/design/IqlSP33oWVp3qOzVtO2ask/Marketly?node-id=0-1&t=m6ZvczGAwbmqtegh-0",
  "figmaAssets": {},
  "sections": [
    {
      "id": "00-overview",
      "title": "Overview",
      "level": 1,
      "blocks": [
        {
          "type": "paragraph",
          "text": "Marketly — Landing Page Content",
          "html": "<p>Marketly — Landing Page Content</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Source content for design-matched landing page generation",
          "html": "<p><em>Source content for design-matched landing page generation</em></p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Agent instructions: Use this document as the textual content source. Use the separately supplied Marketly.png screenshot and Figma design URL for visual structure, spacing, colors, typography, background patterns, icons, and responsive behavior. Preserve visible wording and order. Do not invent missing link destinations, functionality, or additional marketing claims.",
          "html": "<p>Agent instructions: Use this document as the textual content source. Use the separately supplied Marketly.png screenshot and Figma design URL for visual structure, spacing, colors, typography, background patterns, icons, and responsive behavior. Preserve visible wording and order. Do not invent missing link destinations, functionality, or additional marketing claims.</p>",
          "links": []
        }
      ]
    },
    {
      "id": "02-header",
      "title": "Header",
      "level": 1,
      "blocks": [
        {
          "type": "heading",
          "level": 1,
          "text": "1. Header",
          "html": "<h1>1. Header</h1>"
        },
        {
          "type": "paragraph",
          "text": "Brand: Marketly (logo includes a vertical bar-chart style icon).",
          "html": "<p>Brand: Marketly (logo includes a vertical bar-chart style icon).</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Header call-to-action: Contact Us",
          "html": "<p>Header call-to-action: Contact Us</p>",
          "links": []
        }
      ]
    },
    {
      "id": "03-contact-hero",
      "title": "Contact Hero",
      "level": 1,
      "blocks": [
        {
          "type": "heading",
          "level": 1,
          "text": "2. Contact Hero",
          "html": "<h1>2. Contact Hero</h1>"
        },
        {
          "type": "paragraph",
          "text": "Eyebrow: Get Started",
          "html": "<p>Eyebrow: Get Started</p>",
          "links": []
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Get in touch with us. We're here to assist you.",
          "html": "<h2>Get in touch with us. We're here to assist you.</h2>"
        },
        {
          "type": "paragraph",
          "text": "Social icons shown beside the heading: Facebook, Instagram, Twitter.",
          "html": "<p>Social icons shown beside the heading: Facebook, Instagram, Twitter.</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "No supporting paragraph copy is visible beneath the main heading.",
          "html": "<p>No supporting paragraph copy is visible beneath the main heading.</p>",
          "links": []
        }
      ]
    },
    {
      "id": "04-contact-form",
      "title": "Contact Form",
      "level": 1,
      "blocks": [
        {
          "type": "heading",
          "level": 1,
          "text": "3. Contact Form",
          "html": "<h1>3. Contact Form</h1>"
        },
        {
          "type": "paragraph",
          "text": "Desktop arrangement: three fields in one row, followed by a full-width message field.",
          "html": "<p>Desktop arrangement: three fields in one row, followed by a full-width message field.</p>",
          "links": []
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Your Name",
          "html": "<h2>Your Name</h2>"
        },
        {
          "type": "paragraph",
          "text": "Text input",
          "html": "<p>Text input</p>",
          "links": []
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Email Address",
          "html": "<h2>Email Address</h2>"
        },
        {
          "type": "paragraph",
          "text": "Email input",
          "html": "<p>Email input</p>",
          "links": []
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Phone Number (optional)",
          "html": "<h2>Phone Number (optional)</h2>"
        },
        {
          "type": "paragraph",
          "text": "Optional phone input",
          "html": "<p>Optional phone input</p>",
          "links": []
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Message",
          "html": "<h2>Message</h2>"
        },
        {
          "type": "paragraph",
          "text": "Multiline message area",
          "html": "<p>Multiline message area</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Submit button: Leave us a Message →",
          "html": "<p>Submit button: Leave us a Message →</p>",
          "links": []
        }
      ]
    },
    {
      "id": "05-contact-information",
      "title": "Contact Information",
      "level": 1,
      "blocks": [
        {
          "type": "heading",
          "level": 1,
          "text": "4. Contact Information",
          "html": "<h1>4. Contact Information</h1>"
        },
        {
          "type": "paragraph",
          "text": "Eyebrow: Contact Info",
          "html": "<p>Eyebrow: Contact Info</p>",
          "links": []
        },
        {
          "type": "heading",
          "level": 2,
          "text": "We are always happy to assist you",
          "html": "<h2>We are always happy to assist you</h2>"
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Email Address",
          "html": "<h2>Email Address</h2>"
        },
        {
          "type": "paragraph",
          "text": "Email: help@info.com",
          "html": "<p>Email: help@info.com</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Assistance hours: Monday - Friday 6 am to 8 pm EST",
          "html": "<p>Assistance hours: Monday - Friday 6 am to 8 pm EST</p>",
          "links": []
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Number",
          "html": "<h2>Number</h2>"
        },
        {
          "type": "paragraph",
          "text": "Phone: (808) 998-34256",
          "html": "<p>Phone: (808) 998-34256</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Assistance hours: Monday - Friday 6 am to 8 pm EST",
          "html": "<p>Assistance hours: Monday - Friday 6 am to 8 pm EST</p>",
          "links": []
        }
      ]
    },
    {
      "id": "06-newsletter",
      "title": "Newsletter",
      "level": 1,
      "blocks": [
        {
          "type": "heading",
          "level": 1,
          "text": "5. Newsletter",
          "html": "<h1>5. Newsletter</h1>"
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Subcribe to our Newsletter",
          "html": "<h2>Subcribe to our Newsletter</h2>"
        },
        {
          "type": "paragraph",
          "text": "Subscribe for Updates: Stay informed about the latest investor updates, financial results, and announcements by subscribing to our newsletter.",
          "html": "<p>Subscribe for Updates: Stay informed about the latest investor updates, financial results, and announcements by subscribing to our newsletter.</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Email input placeholder: Enter your email",
          "html": "<p>Email input placeholder: Enter your email</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Button: Subscribe",
          "html": "<p>Button: Subscribe</p>",
          "links": []
        }
      ]
    },
    {
      "id": "07-footer",
      "title": "Footer",
      "level": 1,
      "blocks": [
        {
          "type": "heading",
          "level": 1,
          "text": "6. Footer",
          "html": "<h1>6. Footer</h1>"
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Brand and company details",
          "html": "<h2>Brand and company details</h2>"
        },
        {
          "type": "paragraph",
          "text": "Brand: Marketly",
          "html": "<p>Brand: Marketly</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Address: A108 Adam Street New York, NY 535022",
          "html": "<p>Address: A108 Adam Street New York, NY 535022</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Country: United States",
          "html": "<p>Country: United States</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Phone: +1 5589 55488 55",
          "html": "<p>Phone: +1 5589 55488 55</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Email: info@example.com",
          "html": "<p>Email: info@example.com</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "Social links/icons: Facebook, Twitter, Instagram, LinkedIn",
          "html": "<p>Social links/icons: Facebook, Twitter, Instagram, LinkedIn</p>",
          "links": []
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Footer navigation",
          "html": "<h2>Footer navigation</h2>"
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Education",
          "html": "<h2>Education</h2>"
        },
        {
          "type": "list",
          "ordered": false,
          "items": [
            "Email Marketing",
            "Social Media Marketing",
            "Search Engine Optimization",
            "Product Development",
            "Web Development"
          ],
          "html": "<ul><li>Email Marketing</li><li>Social Media Marketing</li><li>Search Engine Optimization</li><li>Product Development</li><li>Web Development</li></ul>"
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Business",
          "html": "<h2>Business</h2>"
        },
        {
          "type": "list",
          "ordered": false,
          "items": [
            "Digital Marketing Agency",
            "SEO Agency",
            "PPC Agency",
            "Content Marketing Agency",
            "Internet Marketing Agency",
            "Locations",
            "Industries We Serve"
          ],
          "html": "<ul><li>Digital Marketing Agency</li><li>SEO Agency</li><li>PPC Agency</li><li>Content Marketing Agency</li><li>Internet Marketing Agency</li><li>Locations</li><li>Industries We Serve</li></ul>"
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Developer & IT",
          "html": "<h2>Developer &amp; IT</h2>"
        },
        {
          "type": "list",
          "ordered": false,
          "items": [
            "Internet Marketing",
            "Content Marketing",
            "Social Media",
            "Web Design",
            "Seo",
            "PPC",
            "Amazon"
          ],
          "html": "<ul><li>Internet Marketing</li><li>Content Marketing</li><li>Social Media</li><li>Web Design</li><li>Seo</li><li>PPC</li><li>Amazon</li></ul>"
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Company",
          "html": "<h2>Company</h2>"
        },
        {
          "type": "list",
          "ordered": false,
          "items": [
            "About us",
            "Contact us",
            "SEO Checker",
            "Tools",
            "Marketing Guides",
            "Careers"
          ],
          "html": "<ul><li>About us</li><li>Contact us</li><li>SEO Checker</li><li>Tools</li><li>Marketing Guides</li><li>Careers</li></ul>"
        },
        {
          "type": "heading",
          "level": 2,
          "text": "Copyright",
          "html": "<h2>Copyright</h2>"
        },
        {
          "type": "paragraph",
          "text": "© Copyright Marketly. All Rights Reserved",
          "html": "<p>© Copyright Marketly. All Rights Reserved</p>",
          "links": []
        },
        {
          "type": "paragraph",
          "text": "A circular back-to-top control with an upward chevron appears between the newsletter and footer.",
          "html": "<p>A circular back-to-top control with an upward chevron appears between the newsletter and footer.</p>",
          "links": []
        }
      ]
    },
    {
      "id": "08-visual-and-layout-notes",
      "title": "Visual and Layout Notes",
      "level": 1,
      "blocks": [
        {
          "type": "heading",
          "level": 1,
          "text": "7. Visual and Layout Notes",
          "html": "<h1>7. Visual and Layout Notes</h1>"
        },
        {
          "type": "list",
          "ordered": false,
          "items": [
            "The contact hero has a white background, centered content width, and generous whitespace.",
            "Marketly logo at upper left; purple pill-shaped Contact Us button at upper right.",
            "Large, bold, black, left-aligned main heading. Three circular social buttons are vertically stacked at the right.",
            "Contact form: three horizontal fields on desktop with thin light-gray underlines, followed by a full-width message field.",
            "The Leave us a Message button is purple, rounded, and includes a right arrow.",
            "Contact Info uses a pale repeating topographic-line background pattern.",
            "Newsletter section has a vivid purple background, white text, and a horizontal email subscription control.",
            "Footer has a near-black background, white logo, muted gray contact details, and four navigation columns.",
            "Use responsive behavior appropriate to smaller screens; use Figma evidence for exact spacing, fonts, breakpoints, and assets when available.",
            "The screenshot does not establish actual form submission, newsletter subscription, or link destinations. Do not claim these functions work without configured behavior."
          ],
          "html": "<ul><li>The contact hero has a white background, centered content width, and generous whitespace.</li><li>Marketly logo at upper left; purple pill-shaped Contact Us button at upper right.</li><li>Large, bold, black, left-aligned main heading. Three circular social buttons are vertically stacked at the right.</li><li>Contact form: three horizontal fields on desktop with thin light-gray underlines, followed by a full-width message field.</li><li>The Leave us a Message button is purple, rounded, and includes a right arrow.</li><li>Contact Info uses a pale repeating topographic-line background pattern.</li><li>Newsletter section has a vivid purple background, white text, and a horizontal email subscription control.</li><li>Footer has a near-black background, white logo, muted gray contact details, and four navigation columns.</li><li>Use responsive behavior appropriate to smaller screens; use Figma evidence for exact spacing, fonts, breakpoints, and assets when available.</li><li>The screenshot does not establish actual form submission, newsletter subscription, or link destinations. Do not claim these functions work without configured behavior.</li></ul>"
        }
      ]
    },
    {
      "id": "09-content-and-evidence-rules",
      "title": "Content and Evidence Rules",
      "level": 1,
      "blocks": [
        {
          "type": "heading",
          "level": 1,
          "text": "8. Content and Evidence Rules",
          "html": "<h1>8. Content and Evidence Rules</h1>"
        },
        {
          "type": "list",
          "ordered": false,
          "items": [
            "Preserve visible wording, including the screenshot spelling 'Subcribe to our Newsletter', unless the design source or user confirms a correction.",
            "Do not invent extra contact details, business claims, link destinations, or form success messages.",
            "Use actual Figma assets when available. Keep Marketly.png separate as the visual reference; do not embed it in this DOCX.",
            "Record unavailable assets, uncertain text, unresolved destinations, and unverified responsive behavior in the generation report."
          ],
          "html": "<ul><li>Preserve visible wording, including the screenshot spelling 'Subcribe to our Newsletter', unless the design source or user confirms a correction.</li><li>Do not invent extra contact details, business claims, link destinations, or form success messages.</li><li>Use actual Figma assets when available. Keep Marketly.png separate as the visual reference; do not embed it in this DOCX.</li><li>Record unavailable assets, uncertain text, unresolved destinations, and unverified responsive behavior in the generation report.</li></ul>"
        }
      ]
    }
  ]
};
