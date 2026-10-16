# Brand and Navigation

This is an independent, editable Next.js landing-page application generated for BigDrops Marketing.

## Development

```bash
pnpm install
pnpm --filter @bdmg/unada dev
```

## Production Build

```bash
pnpm --filter @bdmg/unada build
```

## Manual Editing

- Edit page sections in `src/sections/`.
- Edit shared components in `src/components/`.
- Edit design tokens and page styling in `src/app/globals.css`.
- Add static assets in `public/assets/`.

Future generation runs should create a new app directory unless you explicitly approve overwriting this app.

## Source evidence

- The page content is generated from the supplied DOCX.
- Live Figma MCP inspection was unavailable because the file was not shared for editing. A validated Figma REST response was acquired with the configured local PAT and recorded as `figma-api-json` evidence.
- The REST fallback contained no retrievable assets or responsive frames. Those gaps, along with the unavailable source illustrations, remain recorded in `generation-report.json` and `figma-assets.json`; no temporary Figma URLs are used in the app.
