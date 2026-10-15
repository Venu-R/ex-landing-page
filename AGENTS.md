
# BigDrops Landing Page Agent

This repository is organized around an AI-agent-assisted workflow for producing maintainable landing-page applications from these inputs:

- `content.docx`
- an original design PNG reference (desktop is required; mobile/tablet references are recommended when supplied)
- a node-specific Figma design URL

A saved Figma API JSON response may be used as a fallback when Figma MCP is unavailable or rate-limited.

Codex is the design reasoning and coding agent. Deterministic tools in `tools/landing-page-agent` support repeatable parsing, scaffolding, reporting, and QA, but they are not a substitute for design inspection and implementation judgment.

## Ground Rules

- Generate every landing page as an independent app under `apps/<page-name>/`.
- Do not overwrite an existing app or manual edits unless the user explicitly approves it.
- Do not rely on legacy blueprint content-to-design mappings as authoritative.
- Use Figma MCP to inspect actual frames, screenshots, typography, colors, layouts, components, image fills, icons, and assets whenever Figma access is available.
- If Figma MCP or credentials are unavailable, say so plainly and use only verified local alternatives, such as saved fixtures.
- **ADDED:** If Figma MCP is unavailable, fails to connect, or is rate-limited, use the supplied `figma-response.json` as a fallback when it is available and can be validated. Do not repeatedly retry a failing or rate-limited MCP connection when usable saved evidence is available.
- Do not claim visual accuracy, Lighthouse scores, accessibility status, or integration success unless those checks were actually run.
- Keep credentials out of app code. Use `.env.example` for required configuration.
- Do not deploy or publish generated code from this repository.

## Active Architecture

- `apps/`: independent landing-page apps. Each app owns its components, sections, styles, assets, configuration, README, and `.env.example`.
- `packages/`: reusable shared packages only.
- `tools/landing-page-agent/`: reusable DOCX parsing, Figma URL handling, app scaffolding, QA helpers, reports, and legacy BDMG references.
- `fixtures/`: preserved inputs and reference artifacts for examples and regression tests.

## Generation Workflow

For a new landing page:

1. Parse `content.docx` and preserve all meaningful headings, paragraphs, links, lists, tables, and image references.
2. Inspect the supplied Figma URL with Figma MCP. Capture metadata and screenshots at the relevant viewport/frame sizes.
3. Inspect the original PNG reference at its actual dimensions and compare the design structure and visual screenshot with the DOCX content. Decide section order, content placement, assets, responsive behavior, and implementation strategy.
4. Generate a maintainable Next.js app in `apps/<page-name>/` with readable React sections and organized CSS/design tokens.
5. Export or resolve permitted Figma assets into the app's `public/` tree.
6. Run type checks, a production build, Playwright browser checks, screenshot captures, visual comparisons, accessibility checks, SEO checks, and Lighthouse/performance checks where available.
7. Fix concrete discrepancies and repeat within a bounded iteration limit, normally three passes.
8. Write an honest QA report that lists commands run, evidence collected, unresolved mismatches, skipped checks, and missing configuration.

**UPDATED:** Normal design-accurate generation must validate the content DOCX, original reference PNG, and available design evidence. Design evidence may come from live Figma MCP inspection or a validated saved Figma API JSON response when MCP is unavailable or rate-limited. Clearly identify which source was used. A missing reference PNG or incomplete essential design evidence makes visual fidelity unverified; generated output must not claim parity. The normalized design specification must distinguish measured Figma properties from inferred or unavailable values.

## Agent-orchestrated execution

When the user supplies the DOCX, reference PNG, and node-specific Figma URL, the coding agent must orchestrate the MCP-dependent work before invoking the deterministic CLI:

1. Read the DOCX with the landing-page agent and preserve its headings, paragraphs, lists, tables, links, and image references.
2. Load the Figma design-to-code guidance and attempt to inspect the supplied URL with Figma MCP. When MCP is available, capture the relevant frames, text, typography, colors, styles, screenshots, image/SVG asset URLs, and every available responsive frame. Do not infer missing states or destinations.

   **ADDED:** If MCP is unavailable, fails to connect, or is rate-limited, inspect the supplied `figma-response.json` instead. Validate that it is parseable and contains the expected design document before using it. Extract the available document structure, text, node properties, layout information, component information, styles, and asset references. Use only information actually present in the JSON. Do not claim that live MCP inspection occurred.

3. Write a temporary validated evidence JSON with a source identifier that accurately represents its provenance:
   - Use `source: "figma-mcp"` for evidence obtained through live Figma MCP inspection.
   - **UPDATED:** Use `source: "figma-api-json"` for evidence derived from a saved Figma API JSON response.

   Include the available file key/node, inspected sections, text/styles/assets, and responsive frame inventory. Pass the evidence to generation with `--figma-evidence`; do not ask the user to edit JSON or copy asset URLs.

4. Reconcile DOCX and design evidence. Record missing content, conflicting values, unavailable assets, unresolved links, and absent responsive references. Ask the user only when a source decision is required; otherwise preserve the unresolved state in the report.

5. **UPDATED:** Run generation using validated design evidence from either live MCP inspection or the saved JSON fallback. Do not use `--allow-unverified` merely because MCP is unavailable if valid saved JSON evidence can satisfy the CLI's evidence requirements. The CLI must validate the evidence format and provenance, download HTTP(S) assets into the generated app's `public/assets/`, verify responses, write `figma-assets.json`, and refuse design-accurate generation when neither usable MCP evidence nor valid saved JSON evidence is available.

   **ADDED:** If the existing CLI accepts only MCP-derived evidence, do not bypass its validation or falsely label saved JSON as MCP evidence. Make only the minimal compatible adjustment needed to accept validated saved JSON evidence, preserving existing validation and generation behavior for MCP evidence.

6. Start the generated app, run typecheck/build, then invoke browser QA with configured reference screenshots, `--visual-threshold`, `--repair-iterations`, and Lighthouse where available.
7. For failed visual comparisons, make concrete code changes, rerun QA, and stop after at most three repair passes. Never report visual parity when reference screenshots or responsive frames were unavailable.
8. Report which steps were automated by the CLI, which design-evidence source was used, which checks passed/failed/skipped/unverified, and all remaining manual approvals or missing source evidence.

## Legacy Code Policy

Legacy blueprint and coordinate-renderer code is kept only as reference or for selective utility reuse. It should not be the default runtime architecture for generated apps.

Useful legacy pieces include:

- DOCX parsing behavior.
- Figma normalization ideas.
- Asset inventory patterns.
- Figma-to-CSS conversion helpers.

Avoid reintroducing:

- generated apps that depend on `page-plan.json` at runtime,
- blanket use of `@bdmg/ui/FigmaPage`,
- blueprint mapping confidence as the source of truth.

## Quality Bar

Generated apps should use semantic HTML, accessible forms, typed React, organized components, responsive CSS, optimized images, accurate metadata, and minimal unnecessary JavaScript.

The target is Lighthouse Performance >= 90 and SEO >= 95 under a documented local test configuration, but actual measured results must be reported honestly.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.

<!-- END:turborepo-agent-rules -->
