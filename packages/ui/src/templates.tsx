
import type { ReactNode } from "react";
import type {
  BlueprintSection,
  BlueprintContentItem
} from "@bdmg/types";

export interface SectionTemplateProps {
  section: BlueprintSection;
}

function renderBlock(
  block: BlueprintContentItem,
  key: string
): ReactNode {
  switch (block.type) {
    case "heading": {
      const level = Math.min(6, Math.max(2, block.level ?? 2));
      const Tag = `h${level}` as
        | "h2"
        | "h3"
        | "h4"
        | "h5"
        | "h6";

      return <Tag key={key}>{block.text ?? ""}</Tag>;
    }

    case "paragraph":
      return <p key={key}>{block.text ?? ""}</p>;

    case "list": {
      const Tag = block.ordered ? "ol" : "ul";

      return (
        <Tag key={key}>
          {(block.items ?? []).map((item, index) => (
            <li key={`${key}-${index}`}>{item}</li>
          ))}
        </Tag>
      );
    }

    case "table":
      return (
        <div className="table-scroll" key={key}>
          <table>
            <tbody>
              {(block.rows ?? []).map((row, rowIndex) => (
                <tr key={`${key}-row-${rowIndex}`}>
                  {row.map((value, cellIndex) => {
                    const cell = block.cells?.[rowIndex]?.[cellIndex];
                    const CellTag = cell?.header ? "th" : "td";

                    return (
                      <CellTag
                        key={`${key}-${rowIndex}-${cellIndex}`}
                        colSpan={cell?.colSpan}
                        rowSpan={cell?.rowSpan}
                      >
                        {cell?.text ?? value}
                      </CellTag>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "image": {
      const image = block.image;

      return image?.src ? (
        <img
          key={key}
          src={image.src}
          alt={image.alt ?? ""}
          loading="lazy"
        />
      ) : (
        <p key={key} className="missing-image">
          {image?.alt || "Image asset requires configuration"}
        </p>
      );
    }

    default:
      return null;
  }
}

function isHeading(block: BlueprintContentItem): boolean {
  return block.type === "heading" && Boolean(block.text?.trim());
}

function SectionHeading({ section }: SectionTemplateProps) {
  const first = section.content[0];

  // Avoid repeating the section title when the DOCX already contains it.
  const titleAlreadyPresent =
    first?.type === "heading" &&
    typeof first.text === "string" &&
    first.text.trim().toLowerCase() === section.title.trim().toLowerCase();

  return titleAlreadyPresent ? null : (
    <h2 className="landing-section__title">{section.title}</h2>
  );
}

function SectionBody({ section }: SectionTemplateProps) {
  return (
    <div className="template-body">
      {section.content.map((block, index) =>
        renderBlock(block, `${section.id}-${index}`)
      )}
    </div>
  );
}

/**
 * Groups content under each heading.
 * Useful for pricing plans, feature cards, and FAQ entries.
 */
function groupByHeading(section: BlueprintSection) {
  const groups: Array<{
    title: string;
    blocks: BlueprintContentItem[];
  }> = [];

  for (const block of section.content) {
    if (isHeading(block)) {
      groups.push({
        title: block.text ?? "",
        blocks: []
      });
    } else if (groups.length > 0) {
      groups[groups.length - 1]?.blocks.push(block);
    } else {
      groups.push({
        title: "",
        blocks: [block]
      });
    }
  }

  return groups;
}

function NavigationTemplate({ section }: SectionTemplateProps) {
  const links = section.content.flatMap((block) => {
    if (block.type === "list") {
      return (block.items ?? []).map((text) => ({ text, href: "#" }));
    }

    if (block.type === "paragraph" && typeof block.text === "string") {
      return (block.text.match(/[^|•]+/g) ?? [])
        .map((text) => text.trim())
        .filter(Boolean)
        .map((text) => ({ text, href: "#" }));
    }

    return [];
  });

  return (
    <header className="template-navigation">
      <a className="template-navigation__brand" href="#">
        {section.title}
      </a>

      {links.length > 0 && (
        <nav aria-label="Main navigation">
          {links.map((link, index) => (
            <a key={`${link.text}-${index}`} href={link.href}>
              {link.text}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

function HeroTemplate({ section }: SectionTemplateProps) {
  const firstHeadingIndex = section.content.findIndex(isHeading);
  const heading =
    firstHeadingIndex >= 0
      ? section.content[firstHeadingIndex]
      : undefined;

  const descriptionBlocks = section.content.filter(
    (block) => block !== heading
  );

  return (
    <section className="template-hero">
      <div className="template-hero__content">
        <SectionHeading section={section} />

        {heading && (
          <div className="template-hero__headline">
            {renderBlock(heading, `${section.id}-hero-heading`)}
          </div>
        )}

        <div className="template-hero__description">
          {descriptionBlocks.map((block, index) =>
            renderBlock(block, `${section.id}-hero-${index}`)
          )}
        </div>
      </div>
    </section>
  );
}

function FeaturesTemplate({ section }: SectionTemplateProps) {
  const groups = groupByHeading(section);
  const canUseCards = groups.length >= 2;

  return (
    <div className="template-features">
      <SectionHeading section={section} />

      {canUseCards ? (
        <div className="template-card-grid">
          {groups.map((group, index) => (
            <article className="template-card" key={`${group.title}-${index}`}>
              {group.title && <h3>{group.title}</h3>}
              {group.blocks.map((block, blockIndex) =>
                renderBlock(block, `${section.id}-feature-${index}-${blockIndex}`)
              )}
            </article>
          ))}
        </div>
      ) : (
        <SectionBody section={section} />
      )}
    </div>
  );
}

function PricingTemplate({ section }: SectionTemplateProps) {
  const groups = groupByHeading(section);
  const canUseCards = groups.length >= 2;

  return (
    <div className="template-pricing">
      <SectionHeading section={section} />

      {canUseCards ? (
        <div className="template-card-grid template-pricing__grid">
          {groups.map((group, index) => (
            <article className="template-card template-price-card" key={`${group.title}-${index}`}>
              {group.title && <h3>{group.title}</h3>}
              {group.blocks.map((block, blockIndex) =>
                renderBlock(block, `${section.id}-price-${index}-${blockIndex}`)
              )}
            </article>
          ))}
        </div>
      ) : (
        <SectionBody section={section} />
      )}
    </div>
  );
}

function ComparisonTemplate({ section }: SectionTemplateProps) {
  const hasTable = section.content.some((block) => block.type === "table");

  return (
    <div className="template-comparison">
      <SectionHeading section={section} />

      {hasTable ? (
        <SectionBody section={section} />
      ) : (
        <div className="template-comparison__columns">
          {groupByHeading(section).map((group, index) => (
            <article className="template-card" key={`${group.title}-${index}`}>
              {group.title && <h3>{group.title}</h3>}
              {group.blocks.map((block, blockIndex) =>
                renderBlock(block, `${section.id}-comparison-${index}-${blockIndex}`)
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function TestimonialsTemplate({ section }: SectionTemplateProps) {
  const paragraphs = section.content.filter(
    (block) => block.type === "paragraph" || block.type === "heading"
  );

  const hasMultipleItems = paragraphs.length >= 2;

  return (
    <div className="template-testimonials">
      <SectionHeading section={section} />

      {hasMultipleItems ? (
        <div className="template-card-grid">
          {paragraphs.map((block, index) => (
            <figure className="template-testimonial" key={`${section.id}-quote-${index}`}>
              <blockquote>{block.text ?? ""}</blockquote>
            </figure>
          ))}
          {section.content
            .filter((block) => block.type !== "paragraph" && block.type !== "heading")
            .map((block, index) =>
              renderBlock(block, `${section.id}-testimonial-extra-${index}`)
            )}
        </div>
      ) : (
        <SectionBody section={section} />
      )}
    </div>
  );
}

function FaqTemplate({ section }: SectionTemplateProps) {
  const groups = groupByHeading(section);
  const canUseFaq = groups.length >= 2;

  return (
    <div className="template-faq">
      <SectionHeading section={section} />

      {canUseFaq ? (
        <div className="template-faq__list">
          {groups.map((group, index) => (
            <details className="template-faq__item" key={`${group.title}-${index}`}>
              <summary>{group.title || `Question ${index + 1}`}</summary>
              <div className="template-faq__answer">
                {group.blocks.map((block, blockIndex) =>
                  renderBlock(block, `${section.id}-faq-${index}-${blockIndex}`)
                )}
              </div>
            </details>
          ))}
        </div>
      ) : (
        <SectionBody section={section} />
      )}
    </div>
  );
}

function FooterTemplate({ section }: SectionTemplateProps) {
  return (
    <footer className="template-footer">
      <div className="template-footer__inner">
        <h2>{section.title}</h2>
        <SectionBody section={section} />
      </div>
    </footer>
  );
}

function ContentTemplate({ section }: SectionTemplateProps) {
  return (
    <div className="template-content">
      <SectionHeading section={section} />
      <SectionBody section={section} />
    </div>
  );
}

export const SECTION_TEMPLATES = {
  navigation: NavigationTemplate,
  hero: HeroTemplate,
  features: FeaturesTemplate,
  pricing: PricingTemplate,
  comparison: ComparisonTemplate,
  testimonials: TestimonialsTemplate,
  faq: FaqTemplate,
  footer: FooterTemplate,
  content: ContentTemplate,
  custom: ContentTemplate
} satisfies Record<
  string,
  (props: SectionTemplateProps) => ReactNode
>;

export type SectionTemplateCategory = keyof typeof SECTION_TEMPLATES;
