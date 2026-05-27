# Allerion Construction Skills

Construction-domain Claude Code skills, built on the gstack pattern
([github.com/garrytan/gstack](https://github.com/garrytan/gstack)).

## Architecture

- **Global skills** — CEO, Eng Manager, QA, Designer, Browser, etc. — come from
  gstack. Install once with `./scripts/install-gstack.sh` and they apply to
  every Claude Code session you open anywhere.
- **Allerion skills** — this directory. Construction-domain agents that
  auto-load when Claude Code opens this repo. They map to the HEO
  (Hyper-Enabled Operator) doctrine: **GATHER → ASSESS → DECIDE**.

## Current skills (v0)

| Skill | Phase | Purpose |
|---|---|---|
| `/office-hours` | n/a | Construction-founder office hours: framing, vision sharpening, board-style reframe |
| `/doctrine` | DECIDE | The orchestrator — reads all other agents and proposes COAs to the operator |
| `/safety` | ASSESS | OSHA 1926, ANSI Z87.1 / Z89.1 / Z359 enforcement, exclusion-zone surveillance |
| `/geo` | GATHER | USGS, Earth MRI, NURE, NRCS, state surveys — ground-truth subsurface for any site |
| `/permit` | ASSESS | Federal / state / county code, NPDES, ACOE §404, SHPO, tribal overlays |
| `/equipment` | GATHER | Retrofit telemetry, fleet health, fault codes, autonomy status |

More agents arrive as the 20-agent HEO stack fills in. The full taxonomy is in
`BATTLE_PLAN.md` § V.

## How to invoke

In Claude Code, type `/<skill-name>` like any other slash command:

```
/office-hours
/doctrine
/safety check the current site plan against OSHA 1926
/geo summarize Earth MRI data for the Hardin parcel
/permit list everything required to drill a 500ft core hole on the parcel
/equipment status on DOZER-01
```

## How to add a skill

Create a new `.md` file in this directory. Follow the structure of `safety.md`
(YAML frontmatter with `description`, then a markdown body that is the agent's
prompt). Commit it to the branch you're working on.

## Why this layout

gstack = horizontal skills (every founder needs CEO/QA/Designer regardless of
domain). Allerion skills = vertical skills (this is a construction-tech
company, so the agents speak USGS / OSHA / ACOE / ISOBUS / NPDES fluently).
The two layers compose. When you run `/ship` (from gstack) on a construction
feature, it can call `/safety` (from Allerion) to verify OSHA compliance
before release.
