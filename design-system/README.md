# Allerion `_/\_` Design System

A small, ready-to-sync component library for the Allerion brand and the
`_/\_` (Allerion Code) product. Each `*.html` is a self-contained preview card,
tagged with a first-line `<!-- @dsCard group="…" -->` marker so the Claude Design
"Design System" pane indexes it automatically.

## Cards

| File | Group | What it shows |
|------|-------|---------------|
| `logo.html` | Brand | The `_/\_` wordmark (light + dark) and glyph mark |
| `colors.html` | Foundations | Color tokens (olive, silver, gold, ink, surfaces) |
| `typography.html` | Foundations | Fraunces display + Inter body + JetBrains mono scale |
| `buttons.html` | Components | Primary / ghost buttons in 3 sizes |
| `cli-ui.html` | Components | The Allerion Code (`ally`) terminal UI mock |

## How to sync to claude.ai/design (`/design-sync`)

DesignSync needs an **interactive terminal login** that the Claude Code **Web**
environment does not have — so it can't push from a web session. Use one of:

1. **Local Claude Code:** open this repo in Claude Code on your machine and run
   `/design-sync` (it will `/design-login`, let you pick/create a design-system
   project, show a plan, and push these cards).
2. **Claude Design → "Send to Claude Code Web":** seed the project into the
   workspace from Claude Design, then run `/design-sync` here.

Either way, point the sync at this `design-system/` directory. Add new components
as more `*.html` cards with their own `@dsCard` marker and re-sync incrementally —
never wholesale-replace.

## Source of truth

These tokens/components mirror the live marketing rebuild in
[`../marketing-site/index.html`](../marketing-site/index.html). Keep the two in
step when the brand evolves.
