const copy = {
  body: "Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit.",
  workflow: "Sometimes, we need to check the time, wondering when our work or meeting will finish, without getting caught by others.",
  plan: "You want results. We have found that the best way to get them is with up front research – of your company, competitors, target market and customer psychographics. Only after we fully understand you and your customers, do we recommend a plan of attack.",
  quote: "Aliqua id fugiat nostrud irure ex duis ea quis id quis ad et. Sunt qui esse pariatur duis deserunt mollit dolore cillum minim tempor enim. Elit aute irure tempor cupidatat incididunt sint deserunt ut voluptate aute id deserunt nisi.",
};

const services = ["Web Development", "App Development", "AR/VR Development", "Blockchain Development"];

function Arrow() {
  return <span aria-hidden="true">→</span>;
}

function DeveloperArt() {
  return <div className="developer-art" aria-label="Illustration of a software developer using a laptop" role="img">
    <div className="code-screen">{"</>"}</div>
    <div className="developer-head"><span className="hair" /><i /><i /></div>
    <div className="developer-body"><div className="laptop" /><div className="arm" /></div>
    <div className="chair" /><div className="leg leg-left" /><div className="leg leg-right" />
    <div className="floating-chip chip-phone">▦</div><div className="floating-chip chip-vr">⌁</div><div className="floating-chip chip-sat">✦</div>
  </div>;
}

function WorkflowArt() {
  return <div className="workflow-art" aria-label="Illustration of a digital development workflow" role="img">
    <div className="workflow-screen"><span /><span /><span /></div>
    <div className="workflow-crane"><b /><i /><em /></div>
    <div className="workflow-person person-one" /><div className="workflow-person person-two" /><div className="workflow-person person-three" />
    <div className="workflow-tile tile-one" /><div className="workflow-tile tile-two" /><div className="workflow-tile tile-three" />
  </div>;
}

function QualityArt() {
  return <div className="quality-art" aria-label="Quality services illustration" role="img"><div className="quality-photo" /><div className="quality-card"><strong>Quality<br />Services</strong><span>✦</span><b>✓</b><small>Trusted<br />Supplier</small><em>☺</em></div></div>;
}

function Header() {
  return <header className="site-header"><a className="brand" href="#top" aria-label="UNADA home">UNADA<span>.</span></a><nav aria-label="Main navigation"><a href="#top">Home</a><a href="#services">Services</a><a href="#workflow">Metaverse</a><a href="#why-us">Careers</a><a href="#testimonials">Blog</a></nav><a className="contact-button" href="#testimonials">Contact Us <Arrow /></a></header>;
}

function Hero() {
  return <section className="hero section-shell" id="top"><div className="hero-copy"><p className="eyebrow">A TRUSTED COMPANY</p><h1>Next-Gen Software<br />Services to<br />Businesses.</h1><p className="hero-description">{copy.body}</p><a className="primary-button" href="#services">Get Started <Arrow /></a><div className="socials" aria-label="Social links"><a href="#top" aria-label="Dribbble">◉</a><a href="#top" aria-label="Facebook">f</a><a href="#top" aria-label="Instagram">◎</a></div></div><DeveloperArt /></section>;
}

function TrustedCompanies() {
  return <section className="trusted section-shell"><p>Trusted By 4,000+ Companies</p><div className="company-logos"><strong>◉ Spotify</strong><strong>✣ slack</strong><strong>◆ Dropbox</strong><strong>zoom</strong></div></section>;
}

function Services() {
  return <section className="services section-shell" id="services"><div className="service-grid">{services.map((service, index) => <article className={`service-card ${index === 1 ? "featured" : ""}`} key={service}><div className="service-icon">{index === 2 ? "●" : index === 3 ? "◇" : index === 1 ? "▦" : "≡"}</div><h2>{service}</h2><p>{copy.body}</p><a href="#workflow">Learn More <Arrow /></a></article>)}</div></section>;
}

function Workflow() {
  return <section className="content-section centered-section section-shell" id="workflow"><h2>End-To-End Development Services</h2><p>{copy.workflow}</p><WorkflowArt /></section>;
}

function WhyUs() {
  return <section className="content-section section-shell why-us" id="why-us"><div className="section-intro"><h2>Why Choose Us</h2><p>{copy.workflow}</p></div><div className="why-grid"><QualityArt /><div className="accordion"><details><summary>Attention to Details</summary></details><details open><summary>A Plan for Success</summary><p>{copy.plan}</p></details><details><summary>Experts Only</summary></details><details><summary>Meeting Deadlines</summary></details><details><summary>Award-Winning</summary></details></div></div></section>;
}

function Testimonials() {
  return <section className="content-section centered-section testimonials section-shell" id="testimonials"><h2>Feedback from our clients</h2><p>Our WORK speaks louder than our WORD. Find out how we helped clients overcome challenges and succeed.</p><div className="testimonial-grid">{[1, 2].map((item) => <article className="testimonial-card" key={item}><div className="avatar">J</div><div><strong>Jhony D</strong><small>@jhony_D</small></div><blockquote>“{copy.quote}”</blockquote></article>)}</div><div className="pagination-dots" aria-hidden="true"><i /><i /><i /><i /></div></section>;
}

export function LandingPage() {
  return <><Header /><main><Hero /><TrustedCompanies /><Services /><Workflow /><WhyUs /><Testimonials /></main><footer className="footer"><span>UNADA.</span></footer></>;
}
