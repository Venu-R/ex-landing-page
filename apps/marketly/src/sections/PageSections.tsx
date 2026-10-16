function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`logo ${light ? "logo-light" : ""}`}>
      <span className="logo-mark" aria-hidden="true"><i /><i /><i /></span>
      <span>Marketly</span>
    </span>
  );
}

const footerGroups = [
  {
    title: "Education",
    items: ["Email Marketing", "Social Media Marketing", "Search Engine Optimization", "Product Development", "Web Development"],
  },
  {
    title: "Business",
    items: ["Digital Marketing Agency", "SEO Agency", "PPC Agency", "Content Marketing Agency", "Internet Marketing Agency", "Locations", "Industries We Serve"],
  },
  {
    title: "Developer & IT",
    items: ["Internet Marketing", "Content Marketing", "Social Media", "Web Design", "Seo", "PPC", "Amazon"],
  },
  {
    title: "Company",
    items: ["About us", "Contact us", "SEO Checker", "Tools", "Marketing Guides", "Careers"],
  },
];

export function Header() {
  return (
    <header className="site-header">
      <a href="#top" aria-label="Marketly home"><Logo /></a>
      <a className="pill-button header-button" href="#contact-form">Contact Us</a>
    </header>
  );
}

function SocialLinks() {
  return (
    <div className="social-links" aria-label="Social media">
      <a href="#footer" aria-label="Facebook">f</a>
      <a href="#footer" aria-label="Instagram">◎</a>
      <a href="#footer" aria-label="Twitter">♥</a>
    </div>
  );
}

function ContactForm() {
  return (
    <form className="contact-form" id="contact-form">
      <div className="field-row">
        <label>Your Name<input name="name" type="text" /></label>
        <label>Email Address<input name="email" type="email" /></label>
        <label>Phone Number (optional)<input name="phone" type="tel" /></label>
      </div>
      <label className="message-field">Message<textarea name="message" rows={3} /></label>
      <button className="pill-button submit-button" type="submit">Leave us a Message <span aria-hidden="true">→</span></button>
    </form>
  );
}

function ContactInfo() {
  return (
    <section className="contact-info">
      <div className="contact-info-inner">
        <div className="info-intro">
          <p className="eyebrow">Contact Info</p>
          <h2>We are always<br className="desktop-break" /> happy to assist you</h2>
        </div>
        <div className="info-column">
          <h3>Email Address</h3>
          <span className="info-rule" />
          <strong>help@info.com</strong>
          <p>Assistance hours:<br />Monday - Friday 6 am to<br className="desktop-break" /> 8 pm EST</p>
        </div>
        <div className="info-column">
          <h3>Number</h3>
          <span className="info-rule" />
          <strong>(808) 998-34256</strong>
          <p>Assistance hours:<br />Monday - Friday 6 am to<br className="desktop-break" /> 8 pm EST</p>
        </div>
      </div>
    </section>
  );
}

function Newsletter() {
  return (
    <section className="newsletter">
      <div className="newsletter-inner">
        <div>
          <h2>Subcribe to our Newsletter</h2>
          <p>Subscribe for Updates: Stay informed about the latest investor updates,<br className="desktop-break" /> financial results, and announcements by subscribing to our newsletter.</p>
        </div>
        <form className="subscribe-form">
          <input type="email" placeholder="Enter your email" aria-label="Email address" />
          <button type="submit">Subscribe</button>
        </form>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer" id="footer">
      <a className="back-to-top" href="#top" aria-label="Back to top">⌃</a>
      <div className="footer-main">
        <div className="footer-brand">
          <Logo light />
          <p>A108 Adam Street New York, NY 535022<br />United States</p>
          <p>Phone: +1 5589 55488 55</p>
          <p>Email: info@example.com</p>
          <div className="footer-socials" aria-label="Social media">
            <a href="#footer" aria-label="Facebook">f</a><a href="#footer" aria-label="Twitter">♥</a><a href="#footer" aria-label="Instagram">◎</a><a href="#footer" aria-label="LinkedIn">in</a>
          </div>
        </div>
        {footerGroups.map((group) => <div className="footer-group" key={group.title}><h3>{group.title}</h3>{group.items.map((item) => <a href="#footer" key={item}>{item}</a>)}</div>)}
      </div>
      <div className="copyright">© Copyright <strong>Marketly</strong>. All Rights Reserved</div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <main id="top">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Get Started</p>
          <div className="hero-heading-row">
            <h1>Get in touch with us.<br />We're here to assist you.</h1>
            <SocialLinks />
          </div>
        </div>
        <ContactForm />
      </section>
      <ContactInfo />
      <Newsletter />
    </main>
  );
}
