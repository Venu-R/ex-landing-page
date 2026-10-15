# OpenAI Contact Sales

Independent responsive landing page generated from `fixtures/openai/content.docx`
and `fixtures/openai/OpenAI.png`.

## Development

```bash
pnpm --filter @bdmg/openai-contact-sales dev
```

## Verification

```bash
pnpm --filter @bdmg/openai-contact-sales typecheck
pnpm --filter @bdmg/openai-contact-sales build
```

Live Figma MCP inspection and REST refresh were unavailable because the account
was rate-limited. The visual reference and DOCX are the verified sources for
the implementation; this app does not claim Figma parity.
