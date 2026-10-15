"use client";

import { useState } from "react";

const plans: Array<[name: string, price: string, description: string, features: string[], tone: string]> = [
  ["Free", "$0", "For hobby projects", ["Design Editor", "Framer banner"], "cyan"],
  ["Mini", "$5", "For landing pages", ["Home + 404 page", "Custom domain", "1,000 visitors/mo"], "orange"],
  ["Basic", "$15", "For personal sites", ["Unlimited pages", "Password protect", "1 CMS collection", "10,000 visitors/mo"], "pink"],
  ["Pro", "$25", "For bigger sites", ["Analytics", "Staging", "Redirects", "10 CMS collections", "100,000 visitors/mo"], "purple"],
];

const businessCards: Array<[title: string, items: string[]]> = [
  ["Services", ["Onboarding", "Launch support", "SEO & performance audit", "Slack channel with Framer"]],
  ["Infrastructure", ["No hard hosting limits", "Reverse proxy support", "Premium infrastructure", "Custom application limits"]],
  ["Legal & security", ["Business contract", "Centralized yearly billing", "Confidentiality agreement", "Advanced Security"]],
];

const comparisonRows = [
  ["Hosting — Bandwidth", "1 GB", "1 GB", "10 GB", "100 GB", "Custom"],
  ["Hosting — Visitors", "1,000", "1,000", "10,000", "100,000", "Custom"],
  ["Hosting — CDN", "●", "Basic", "●", "Global", "Premium"],
  ["Publishing — Web pages", "●", "Home + 404", "●", "●", "●"],
  ["Features — CMS items", "100", "100", "1,000", "10,000", "Custom"],
  ["Features — CMS collections", "1", "1", "1", "10", "Custom"],
];

const faqs = [
  "How are additional editors billed?",
  "Can I trial Framer before paying?",
  "What payment methods do you offer?",
  "Can I cancel my site plan at any time?",
  "How can I manage my invoices and charges?",
  "What is your refund policy?",
  "How are paid plans billed when moving from a Prototyping to a Site plan?",
];

export function Header() {
  return <header className="site-header">
    <a className="framer-logo" href="#top">✦ Framer</a>
    <nav aria-label="Main navigation">
      {["Why Framer", "Templates", "Community", "Resources", "Awards", "Business", "Pricing"].map((item) => <a href="#pricing" key={item}>{item}<span>⌄</span></a>)}
    </nav>
    <a className="publish-link" href="#pricing">Publish your site for free</a>
  </header>;
}

function PlanCard({ plan, index }: { plan: typeof plans[number]; index: number }) {
  return <article className={`plan-card ${plan[4]}`} style={{ "--order": index } as React.CSSProperties}>
    <div className="card-top"><span>{plan[0]}</span><span className="mini-toggle">● YEARLY</span></div>
    <div className="price">{plan[1]}<small>Per month<br />PER SITE</small></div>
    <p>{plan[2]}</p>
    <ul>{plan[3].map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
    <button>{plan[0] === "Free" ? "Try for Free" : "Get Plan"}</button>
  </article>;
}

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  return <main id="top">
    <section className="hero" id="pricing">
      <div className="hero-glow" />
      <div className="hero-heading"><h1>Site Pricing</h1><p>Start building your site for free.<br />Upgrade to unlock more features.</p></div>
      <div className="plan-grid">{plans.map((plan, index) => <PlanCard key={plan[0]} plan={plan} index={index} />)}</div>
    </section>
    <section className="section team-section">
      <div className="section-heading"><h2>Team Pricing</h2><p>Optionally add editors to<br />collaborate on paid sites.</p></div>
      <div className="team-grid">
        <article className="team-card"><span className="card-label">Team editors</span><strong>$20<small>Per month<br />PER EDITOR</small></strong><ul><li>✓ Team workspace</li><li>✓ Collaborate on paid sites</li><li>✓ Custom code access from team projects</li><li>✓ 7-day version history</li><li>✓ Unlimited viewers</li></ul><button>Add editors</button></article>
        <article className="calculator-card"><span>Cost calculator <span className="mini-toggle">● YEARLY</span></span><strong>$15<small>Per month</small></strong>{[["Mini site", "$5/mo"], ["Basic site", "$15/mo"], ["Pro site", "$25/mo"], ["Editors — first one is free!", "$20/mo"]].map(([label, price]) => <div className="calc-row" key={label}><span>{label}</span><b>{price}</b></div>)}<button>Manage team</button></article>
      </div>
    </section>
    <section className="section business-section">
      <div className="section-heading"><h2>Business</h2><p>When you need custom<br />limits and app features.</p><button className="gradient-button">Learn more</button></div>
      <div className="business-grid">{businessCards.map(([title, items]) => <article className="business-card" key={title}><span className="business-icon">■</span><h3>{title}</h3><ul>{items.map((item) => <li key={item}>✓ {item}</li>)}</ul></article>)}</div>
    </section>
    <section className="section comparison"><div className="comparison-wrap"><table><thead><tr><th>Site plans</th>{["Free", "Mini", "Basic", "Pro", "Business"].map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>{comparisonRows.map((row) => <tr key={row[0]}>{row.map((cell, index) => index === 0 ? <th key={cell}>{cell}</th> : <td key={`${row[0]}-${cell}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div></section>
    <section className="section faq"><h2>FAQ</h2><div className="faq-list">{faqs.map((question, index) => <div className="faq-item" key={question}><button onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index}>{question}<span>＋</span></button>{openFaq === index && <p>Contact our support team for more information about this plan.</p>}</div>)}</div></section>
  </main>;
}

export function Footer() {
  return <footer className="footer"><div className="footer-grid"><div><b>Company</b><span>About</span><span>Careers</span><span>Cookies</span><span>Security</span><span>Privacy</span><span>Terms</span></div><div><b>Templates</b><span>New</span><span>Free</span><span>Agency</span><span>Blog</span><span>Portfolio</span><span>Web3</span></div><div><b>Resources</b><span>Desktop Apps</span><span>Figma Plugin</span><span>Partner program</span><span>Webflow vs. Framer</span><b>Support</b><span>Updates</span><span>Community</span><span>Contact</span></div><div><b>Product</b><span>Learn</span><span>Plugins</span><span>Apps</span><span>Analytics</span><span>Starter</span><span>Pro</span></div></div><div className="footer-meta">Framer · Why Framer · Templates · Community · Resources · Awards · Business · Pricing</div></footer>;
}
