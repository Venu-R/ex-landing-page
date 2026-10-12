import type {
  BlueprintSection,
  LandingPageBlueprint,
  TemplateSelection
} from "@bdmg/types";

type ContentBlock = BlueprintSection["content"][number];

interface GeneratedLandingPageProps {
  blueprint: LandingPageBlueprint;
  selections: TemplateSelection[];
}

function renderBlock(block: ContentBlock, key: string) {
  switch (block.type) {
    case "heading": {
      const level = Math.min(
        6,
        Math.max(2, block.level ?? 2)
      );

      const HeadingTag = `h${level}` as
        | "h2"
        | "h3"
        | "h4"
        | "h5"
        | "h6";

      return (
        <HeadingTag key={key}>
          {block.text ?? ""}
        </HeadingTag>
      );
    }

    case "paragraph":
      return (
        <p key={key}>
          {block.text ?? ""}
        </p>
      );

    case "list": {
      const ListTag = block.ordered ? "ol" : "ul";

      return (
        <ListTag key={key}>
          {(block.items ?? []).map((item, index) => (
            <li key={`${key}-${index}`}>{item}</li>
          ))}
        </ListTag>
      );
    }

    case "table":
      return (
        <div className="table-scroll" key={key}>
          <table>
            <tbody>
              {(block.rows ?? []).map((row, rowIndex) => (
                <tr key={`${key}-row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${key}-${rowIndex}-${cellIndex}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "image":
      return block.image?.src ? (
        <img
          key={key}
          src={block.image.src}
          alt={block.image.alt ?? ""}
          loading="lazy"
        />
      ) : (
        <p key={key} className="missing-image">
          {block.image?.alt || "Image asset requires configuration"}
        </p>
      );

    default:
      return null;
  }
}

function renderSection(
  section: BlueprintSection,
  selection: TemplateSelection | undefined
) {
  const category =
    selection?.templateId?.replace(/-default$/, "") ?? "content";

  return (
    <section
      key={section.id}
      id={section.id}
      className={`landing-section landing-section--${category}`}
      data-template={selection?.templateId ?? "content-default"}
    >
      <div className="landing-section__inner">
        {section.hierarchyLevel > 1 ? null : (
          <h2 className="landing-section__title">
            {section.title}
          </h2>
        )}

        {section.content.map((block, index) =>
          renderBlock(block, `${section.id}-${index}`)
        )}
      </div>
    </section>
  );
}

export function GeneratedLandingPage({
  blueprint,
  selections
}: GeneratedLandingPageProps) {
  const selectionMap = new Map(
    selections.map(selection => [
      selection.sectionId,
      selection
    ])
  );

  const sections = [...blueprint.sections].sort(
    (a, b) => a.order - b.order
  );

  return (
    <main className="generated-landing-page">
      {sections.map(section =>
        renderSection(section, selectionMap.get(section.id))
      )}
    </main>
  );
}