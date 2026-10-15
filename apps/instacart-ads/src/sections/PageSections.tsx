import { pageContent } from "@/data/page-content";

type Block = (typeof pageContent.sections)[number]["blocks"][number];

function BlockView({ block }: { block: Block }) {
  if (block.type === "heading") return <h3>{block.text}</h3>;
  if (block.type === "paragraph") return <p>{block.text}</p>;
  if (block.type === "list") {
    const Tag = block.ordered ? "ol" : "ul";
    return <Tag>{block.items.map((item) => <li key={item}>{item}</li>)}</Tag>;
  }
  if (block.type === "image") return block.src ? <img src={block.src} alt={block.alt} /> : null;
  return <div className="table-wrap"><table><tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>;
}

export function Header() {
  return <header className="site-header"><a className="brand" href="#top">{pageContent.title}</a><nav aria-label="Main navigation">{pageContent.sections.slice(0, 5).map((section) => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}</nav><a className="button button-primary" href="#top">Explore</a></header>;
}

export function LandingPage() {
  return <main id="top"><h1 className="sr-only">{pageContent.title}</h1>{pageContent.sections.map((section, index) => <section className={`section ${index === 0 ? "hero" : ""}`} id={section.id} key={section.id}><div className="section-heading"><p className="eyebrow">Section {index + 1}</p><h2>{section.title}</h2></div><div className="section-content">{section.blocks.filter((block) => block.type !== "heading" || block.text !== section.title).map((block, blockIndex) => <BlockView block={block} key={blockIndex} />)}</div></section>)}</main>;
}

export function Footer() { return <footer className="footer"><strong>{pageContent.title}</strong><span>Generated from approved content and design evidence.</span></footer>; }
