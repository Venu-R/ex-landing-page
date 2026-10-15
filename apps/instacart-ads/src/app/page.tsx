import Image from "next/image";

const assets = "/assets";

const benefits = [
  ["icon-1.svg", "Attract customers", "Over 5,500 brands advertise in our marketplace to reach customers directly at the point of sale—from click, to cart, to checkout."],
  ["icon-2.svg", "Get the results that matter", "Target a range of business goals: Sales growth, Category share, Awareness."],
  ["icon-3.svg", "Unmatched scale", "Easily and conveniently claim prominent shelf space in the digital aisles of 900+ retail brands and over 75,000 stores on our platform with one campaign."],
];

const steps = [
  { number: "1", title: "Choose your products", copy: "Choose what products to promote so they appear in prominent locations where customers are shopping", image: "instacart-logo.svg" },
  { number: "2", title: "Pay for performance", copy: "Set a budget that works for your business and only pay when users engage with your products.", image: "budget-chart.png" },
  { number: "3", title: "Learn what works", copy: "Once your campaign starts, review the results and optimize performance.", image: "performance-chart.png" },
];

function Logo() {
  return <a className="logo" href="#top" aria-label="Instacart Ads home"><Image src={`${assets}/footer-icon-3.svg`} alt="Instacart Ads" width={207} height={24} /></a>;
}

export default function Page() {
  return (
    <main id="top">
      <header className="site-header">
        <Logo />
        <a className="login" href="#footer">Login</a>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <h1>Advertise<br />with<br />Instacart</h1>
          <p>Get in front of customers when they&apos;re searching for products like yours on Instacart.</p>
          <a className="button" href="#initiative">Start now</a>
        </div>
        <div className="hero-image" role="img" aria-label="Roasted meal on a table" />
      </section>

      <section className="initiative" id="initiative">
        <h2>The Instacart Ads<br />Initiative</h2>
        <div className="initiative-card">
          <p>If you identify as a Black-owned consumer packaged goods brand on Instacart, apply to participate in our $1 million advertising initiative</p>
          <a className="button" href="#footer">Submit here</a>
        </div>
        <div className="initiative-card">
          <p>If you identify as a women-owned consumer packaged goods brand on Instacart, apply to participate in our $1 million advertising initiative</p>
          <a className="button" href="#footer">Submit here</a>
        </div>
      </section>

      <section className="marketplace">
        <div>
          <h2>Our marketplace</h2>
          <p>Instacart is the North American leader in online grocery delivery with a marketplace spanning more than 75,000 brick and mortar stores across more than 13,000 cities in the US and Canada. Every day, busy people and families use Instacart to explore the largest grocery catalog in the world, where they can discover new products and buy the brands they love from the retailers they trust.</p>
        </div>
        <div className="marketplace-art" role="img" aria-label="Marketplace illustration" />
      </section>

      <section className="benefits">
        <h2>Why brands partner with us</h2>
        <div className="benefit-grid">
          {benefits.map(([icon, title, copy]) => (
            <article key={title}>
              <div className="benefit-icon"><Image src={`${assets}/${icon}`} alt="" width={128} height={128} /></div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="how-it-works">
        <h2>How it works</h2>
        <div className="steps">
          {steps.map((step) => (
            <article className={`step step-${step.number}`} key={step.number}>
              <div className="step-copy">
                <span className="step-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
                <a href="#footer">Get started</a>
              </div>
              <div className="step-visual">
                {step.number === "1" ? <Image src={`${assets}/instacart-logo.svg`} alt="Product selection card" width={564} height={345} /> : <Image src={`${assets}/${step.image}`} alt="" width={320} height={180} />}
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer id="footer">
        <p>Get our latest insights and updates on the <a href="#top">Instacart Ads blog.</a></p>
      </footer>
    </main>
  );
}
