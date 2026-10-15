const categories = [
  ["megaphone", "Announcements", "We've got our ear to the ground. Here's what you need to know."],
  ["interface", "Discord's Interface", "WHAT DOES THIS BUTTON DO?!11"],
  ["settings", "Account Settings", "You're a special snowflake and so is your account."],
  ["started", "Getting Started", "Start off on the right foot! Not the left one!"],
  ["server", "Server Setup", "Almost as exciting as interior decorating."],
  ["community", "Community Programs", "Bringing people together from all around the globe (and occasionally Mars)"],
  ["perks", "Perks and Subscriptions", "Please don't shop until you drop. Let us help."],
  ["billing", "Billing", "That feel when you look at your bank account."],
  ["trust", "Trust & Safety", "Keeping things safe & sound for you and your buddies."],
  ["faq", "F.A.Q.s", "All you can eat self-serve problem solving."]
] as const;

const support = [
  ["developer", "Developer Support", "Your home for support with developing bots, apps, & games using our API and SDK!"],
  ["twitter", "Twitter", "Have a quick question? Hit us up on Twitter!"]
] as const;

function DiscordMark({ dark = false }: { dark?: boolean }) {
  return <span className={`discord-mark${dark ? " discord-mark-dark" : ""}`} aria-hidden="true">●●</span>;
}

function Illustration({ kind }: { kind: string }) {
  return <span className={`illustration illustration-${kind}`} aria-hidden="true"><span /></span>;
}

export default function Page() {
  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Discord Help Center home"><DiscordMark /> <strong>Discord</strong></a>
        <nav aria-label="Support navigation">
          <a href="#support">Feedback</a>
          <button type="button">English (US)⌄</button>
          <a href="#support">Submit a request</a>
          <a href="#footer">Sign in</a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-art hero-art-left" aria-hidden="true"><span className="hero-person">◕</span></div>
        <div className="hero-art hero-art-right" aria-hidden="true"><span className="hero-person">◉</span></div>
        <div className="hero-content">
          <h1>Help Center</h1>
          <form className="search" role="search">
            <label htmlFor="help-search">Search</label>
            <input id="help-search" name="q" placeholder="Search" />
            <span aria-hidden="true">⌕</span>
          </form>
        </div>
      </section>

      <section className="welcome">
        <h2>Need help? We&apos;ve got your back.</h2>
        <p>From account settings to permissions, find help for everything Discord</p>
        <p>If you&apos;re new to Discord and looking for tips, check out our <a href="#support">Beginner&apos;s Guide</a></p>
      </section>

      <section className="category-grid" aria-label="Help categories">
        {categories.map(([kind, title, copy]) => (
          <a className="help-card" href="#support" key={title}>
            <Illustration kind={kind} />
            <h3>{title}</h3>
            <p>{copy}</p>
          </a>
        ))}
      </section>

      <section className="support-section" id="support">
        <h2>Other ways to find help.</h2>
        <div className="support-grid">
          {support.map(([kind, title, copy]) => (
            <a className="help-card support-card" href="#footer" key={title}>
              <Illustration kind={kind} />
              <h3>{title}</h3>
              <p>{copy}</p>
            </a>
          ))}
        </div>
      </section>

      <aside className="help-widget"><span aria-hidden="true">?</span> Help</aside>

      <footer id="footer">
        <a className="footer-cta" href="#top">LEARN MORE</a>
        <div className="platform-art" aria-hidden="true"><span>◉ ◌ ◍</span><span>▣ ◇</span><span>▦ ⓧ</span></div>
        <div className="footer-links">
          <a className="footer-brand" href="#top"><DiscordMark dark /> <strong>Discord</strong></a>
          <div><h2>Download</h2><a href="#top">Help &amp; Support</a><a href="#top">Feedback</a><a href="#top">Status</a></div>
          <div><h2>Company</h2><a href="#top">Jobs — <em>We&apos;re hiring</em></a><a href="#top">Blog</a><a href="#top">Terms &amp; Privacy</a></div>
        </div>
      </footer>
    </main>
  );
}
