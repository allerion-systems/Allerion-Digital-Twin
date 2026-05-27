# CLAUDE.md — Allerion Digital Twin Developer Context

## Project Overview

This is **Allerion Intelligence's Critical Mineral Digital Twin** — a
browser-based 3D geological visualization platform built for federal
procurement (USGS/DoD). It consists of:

- **index.html** — Project Genesis landing page (corporate portal, timeline,
  document verification)
- **twin.html** — Interactive 3D Digital Twin powered by CesiumJS
- **bastion.html** *(coming)* — HEO Console operator UI on top of the twin

## Bigger picture

The digital twin is **Node 1** of a larger platform: Allerion's Hyper-Enabled
Operator (HEO) console for industrial work — vendor-neutral orchestration of
retrofitted construction equipment, with an agent stack and Z87+ AR PPE on
workers. See `VISION.md` for the canonical vision and `BATTLE_PLAN.md` for
the strategy and 90-day kickoff sequence.

## Architecture

- `index.html` — landing page (self-contained HTML + CSS + JS)
- `twin.html` — 3D Digital Twin shell (loads Cesium + app.js)
- `css/styles.css` — twin-specific styles
- `js/app.js` — core Cesium application logic
- `js/drone.js` — drone simulator + HUD
- `.claude/skills/` — Allerion-specific construction agent skills (HEO stack)
- `scripts/install-gstack.sh` — installs garrytan/gstack global skills

## Tech Stack

- **CesiumJS 1.114** — loaded via CDN
- **Pure HTML/CSS/JS** — no frameworks, no build step (today; React/Next
  arrives with BASTION)
- **Cesium Ion** — terrain, imagery, KML assets
- **Hosting** — GitHub Pages

## Key Coordinates

Property Center: **37.453466, -88.374611** (Section 19, T12S, R8E, Hardin
County, IL).

## Critical Rules — geology integrity

- All mine shafts MUST be within the 40-acre property boundary.
- Hicks Dome data is **NOT** on-property — always label as ADJACENT.
- REE claims below 310 ft are inferred, not measured on-site. Label them.
- This is non-negotiable for scientific integrity AND securities-law reasons
  if the project ever takes outside capital.

## Color palette

- Black `#040506`
- Olive Drab `#5a6850`
- Silver `#9da2a6`
- Accent cyan `#4af0c8` (HEO Console highlight)

## Skill stack — how to use

This repo ships with two layers of Claude Code skills:

### Global skills (gstack)

Install once per machine:

```
./scripts/install-gstack.sh
```

This clones `garrytan/gstack` to `~/.claude/skills/gstack` and runs its setup.
Gives you CEO, Eng Manager, QA, Designer, Browser, Release Engineer, etc. —
applies to every Claude Code session you open anywhere.

### Local skills (Allerion construction)

In `.claude/skills/`. Auto-load when Claude Code opens this repo. Current v0:

- `/office-hours` — construction-founder reframe (overrides gstack default)
- `/doctrine` — HEO orchestrator (GATHER / ASSESS / DECIDE)
- `/safety` — OSHA 1926 + ANSI Z87.1 / Z89.1 / Z359
- `/geo` — USGS, Earth MRI, NURE, NRCS, state surveys
- `/permit` — federal / state / county code, NPDES, ACOE, NEPA
- `/equipment` — retrofit telemetry, fleet health, J1939 / ISOBUS / AGP

More agents arrive as the 20-agent HEO stack fills in. See `BATTLE_PLAN.md`
§ V for the full taxonomy.

## Adding Cesium Sandcastle Features

The Sandcastle viewer maps to our `viewer` variable in `js/app.js`. Copy JS
code into `app.js`, push entities to the `layers` array, and add toggle
buttons in `twin.html` sidebar.

## Security note

**The Cesium Ion access token in `js/app.js` was committed to the public repo
and should be rotated.** Anyone can pull it and burn the Ion quota. Action
item: rotate at cesium.com → ion.cesium.com → Access Tokens, replace in
`js/app.js`, and consider moving it to a runtime config the production page
fetches from a non-public source.
