# CLAUDE.md — Allerion Digital Twin Developer Context

## Project Overview
This is **Allerion Intelligence's Critical Mineral Digital Twin** — a browser-based 3D geological visualization platform built for federal procurement (USGS/DOD). It now ships with a native LLM layer (**Genesis AI**) that drives the twin via tool-calling.

Two main pages:
- **index.html** — Project Genesis landing page (corporate portal, timeline, document verification)
- **twin.html** — Interactive 3D Digital Twin powered by CesiumJS + Genesis AI chat panel

## Architecture
- `index.html` — Landing page (self-contained HTML + CSS + JS)
- `twin.html` — 3D Digital Twin shell (loads Cesium + all JS modules)
- `css/styles.css` — Twin + Genesis AI panel styles
- `js/app.js` — Core Cesium application logic
- `js/drone.js` — Drone simulation mode
- `js/twin-tools.js` — Genesis AI tool dispatcher (`window.TwinTools.*`)
- `js/bim-loader.js` — IFC/BIM loader via ThatOpen Components (web-ifc)
- `js/genesis-ai.js` — Chat panel + LLM conversation loop
- `server.js` — Dev server + proxy to the Genesis AI Worker
- `BIM_INTEGRATIONS.md` — Curated registry of open-source BIM/DT libraries

The LLM backend is a separate repo (`jalleeeee/llm-chat-app-template`,
project name `allerion-genesis-ai`). It exposes `/api/chat`, `/api/tools`,
`/api/bim/*`, `/api/usgs` and runs on Cloudflare Workers + Workers AI.

## Tech Stack
- CesiumJS 1.114 — loaded via CDN
- ThatOpen Components 2.4 + web-ifc — loaded via CDN ESM (lazy)
- Cloudflare Workers + Workers AI (Llama 3.3 70B) — Genesis AI brain
- Pure HTML/CSS/JS — no build step
- Hosting — GitHub Pages (twin) + workers.dev (LLM backend)

## Key Coordinates
Property Center: 37.453466, -88.374611 (Section 19, T12S, R8E, Hardin County, IL)

## Critical Rules
- All mine shafts MUST be within the 40-acre property boundary
- Hicks Dome data is NOT on-property — always label as ADJACENT
- REE claims below 310ft are inferred, not measured on-site
- Color palette: Black #040506, Olive Drab #5a6850, Silver #9da2a6

## Genesis AI tool surface

The LLM calls these via `window.TwinTools.<name>(args)` — implemented in
`js/twin-tools.js`, defined as JSON schemas in
`llm-chat-app-template/src/tools.ts`:

- `fly_to(target, lon?, lat?, altitude_m?)`
- `toggle_layer(layer, visible?)`
- `drop_drill_target(lon, lat, label, rationale?, priority?)`
- `set_view_mode(mode)` — 3d / 2d / satellite / xray / sunlight / orbit-lock / split-screen / drone
- `load_bim_model(url, anchor_lon?, anchor_lat?, name?)`
- `query_usgs(source, bbox?, element?)` — earth_mri / nure / mrds / usgs_3dep
- `search_bim_registry(capability)`
- `annotate_feature(feature_id, text)`

Adding a new tool requires three edits:
1. Schema in `llm-chat-app-template/src/tools.ts → TWIN_TOOLS`
2. Implementation in `js/twin-tools.js`
3. (If user-facing) a hint in `js/genesis-ai.js` welcome message

## Local development

```bash
# 1. Start the Genesis AI Worker
cd ../llm-chat-app-template && npm install && npx wrangler dev
# 2. Start the twin
npm install && npm start
```

Open `http://localhost:3000/twin.html`. The twin's `server.js` proxies
`/api/*` to the Worker on `127.0.0.1:8787`.

## Adding Cesium Sandcastle Features
The Sandcastle viewer maps to our viewer variable in app.js. Copy JS code into app.js, push entities to the layers array (and `window.layers` is already exposed for the LLM dispatcher), and add toggle buttons in twin.html sidebar.

## BIM integrations
See `BIM_INTEGRATIONS.md` for the curated registry and priority queue.
