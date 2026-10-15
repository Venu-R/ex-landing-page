"use client";

import { FormEvent, useState } from "react";

const navigation = ["Research", "Product", "Developers", "Safety", "Company"];

function OpenAILogo() {
  return (
    <a className="logo" href="#top" aria-label="OpenAI home">
      <span className="logo-mark" aria-hidden="true">✺</span>
      <span>OpenAI</span>
    </a>
  );
}

export function Header() {
  return (
    <header className="site-header">
      <OpenAILogo />
      <nav aria-label="Main navigation">
        {navigation.map((item) => (
          <a href="#top" key={item}>{item}<span aria-hidden="true">⌄</span></a>
        ))}
      </nav>
      <a className="search-link" href="#contact">Search</a>
    </header>
  );
}

export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <h1>Contact our<br />sales team</h1>
        <p>
          We&apos;re happy to answer questions and get you acquainted with OpenAI,
          including connecting you with helpful resources, exploring use cases
          for your team, and discussing pricing options.
        </p>
      </div>
      <div className="hero-image" role="img" aria-label="People seated around a red table with a laptop and coffee" />
    </section>
  );
}

const fields = [
  { label: "First name", type: "text", required: true },
  { label: "Last name", type: "text", required: true },
  { label: "Business email", type: "email", required: true },
  { label: "Phone number", type: "tel", required: true },
  { label: "Company name", type: "text", required: true },
  { label: "Job title", type: "text", required: true },
] as const;

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="contact-section" id="contact">
      <h2>Contact</h2>
      <form onSubmit={handleSubmit}>
        {fields.map((field) => (
          <label key={field.label}>
            {field.label} {field.required && <span aria-hidden="true">*</span>}
            <input type={field.type} name={field.label.toLowerCase().replaceAll(" ", "-")} required />
          </label>
        ))}
        <label>
          Country of residence <span aria-hidden="true">*</span>
          <select required defaultValue="">
            <option value="" disabled>Please select...</option>
            <option>United States</option>
            <option>Canada</option>
            <option>United Kingdom</option>
          </select>
          <small>Supported countries and territories</small>
        </label>
        <label>
          Which of our products or services are you interested in? <span aria-hidden="true">*</span>
          <select required defaultValue="">
            <option value="" disabled>Select an option</option>
            <option>ChatGPT</option>
            <option>API platform</option>
            <option>Enterprise</option>
          </select>
        </label>
        <label>
          Anything else you would like us to know?
          <textarea name="message" rows={5} />
        </label>
        <button type="submit">Submit</button>
        {submitted && <p className="form-status" role="status">Thanks — your message is ready to send.</p>}
      </form>
    </section>
  );
}

const footerColumns = [
  ["Research", "Overview", "Index"],
  ["Product", "Overview", "GPT-4", "DALL·E 2", "Customer stories", "Safety standards", "Pricing"],
  ["Safety", "Overview"],
  ["Company", "About", "Careers", "Blog", "Charter"],
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <OpenAILogo />
        <div className="footer-columns">
          {footerColumns.map((column) => (
            <div key={column[0]}>
              <strong>{column[0]}</strong>
              {column.slice(1).map((item) => <a href="#contact" key={item}>{item}</a>)}
            </div>
          ))}
        </div>
      </div>
      <div className="footer-bottom">
        <div><strong>OpenAI © 2015–2023</strong><a href="#contact">Terms &amp; policies</a></div>
        <div className="social-links">
          {["Twitter", "YouTube", "GitHub", "SoundCloud", "LinkedIn"].map((item) => <a href="#contact" key={item}>{item}</a>)}
        </div>
        <a className="back-to-top" href="#top">Back to top ↑</a>
      </div>
    </footer>
  );
}
