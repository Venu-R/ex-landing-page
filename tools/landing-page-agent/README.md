# Landing Page Agent

The deterministic CLI turns approved content, an original PNG reference, and a Figma URL into an independent Next.js app. It does not call Figma MCP itself.

## Generation

```bash
pnpm --filter @bdmg/landing-page-agent generate `
  --content fixtures/example-landing-page/content.docx `
  --reference-desktop fixtures/example-landing-page/reference-desktop.png `
  --figma-url "https://www.figma.com/design/<file-key>/<name>?node-id=0-1" `
  --app future-page
```

The agent should inspect the URL with Figma MCP when available and pass validated `figma-mcp` evidence with `--figma-evidence`. When that evidence is not supplied, the CLI automatically reuses `fixtures/<page-name>/figma-response.json` when it matches the requested file/node, or fetches the raw Figma REST response using the local `FIGMA_ACCESS_TOKEN` from `.env` and saves it there. The raw response is never fabricated; API-derived normalized evidence is marked `figma-api-json`. Use `--refresh-figma` to force a new REST request. Generation automatically downloads permitted HTTP(S) assets into `public/assets/`, verifies each response, and writes localized results to `figma-assets.json`. If neither MCP evidence nor a valid saved/API response is available, generation stops with setup guidance.

Create a local `.env` from the repository `.env.example` and set `FIGMA_ACCESS_TOKEN=`. The token is never written to fixtures, generated apps, reports, or browser-visible configuration. A valid saved response can be reused without a token.

## Parsing and reconciliation

`parseDocx` preserves headings, paragraphs, links, lists, tables, and images. `buildSiteContent` creates ordered sections and first-class link/asset inventories. `reconcileContentAndDesign` records missing sections, numeric/value conflicts, unavailable assets, unresolved links, and absent Figma evidence without fabricating values.

## QA

Start the generated app and run:

```bash
pnpm --filter @bdmg/landing-page-agent qa `
  --app future-page `
  --base-url http://localhost:3000 `
  --lighthouse `
  --repair-iterations 1 `
  --visual-threshold 0.01
```

Playwright captures desktop and mobile screenshots, checks links/images/console errors, runs Axe, compares supplied references, emits comparison artifacts, and optionally runs Lighthouse. Missing references are unverified, not visual passes. Repair iterations are capped at three and are reported as verified only when an agent applies a code change between screenshot passes and reruns the comparison.

## Automated versus MCP-agent steps

The coding agent owns the MCP-dependent steps: inspect the node-specific URL, enumerate frames and responsive variants, retrieve text/styles/screenshots, collect MCP asset URLs, save the evidence JSON, reconcile source conflicts, and decide which localized assets belong in the page. The deterministic CLI owns the repeatable steps: parse DOCX, validate evidence shape, download and verify assets, create a non-destructive independent app, write the reconciliation/report files, and run browser QA. The CLI intentionally does not call MCP because no MCP client integration exists in this package.
