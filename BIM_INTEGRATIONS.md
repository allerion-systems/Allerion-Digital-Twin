# BIM & Open-Source Digital-Twin Integrations

This is the curated registry of open-source BIM and digital-twin
projects that the Allerion Genesis AI platform can integrate. It is the
source of truth referenced by the LLM tool `search_bim_registry` (see
`llm-chat-app-template/src/tools.ts → BIM_REGISTRY`) and by the
operator-facing docs.

The Cesium twin already ships with **CesiumJS** + **ThatOpen Components
(web-ifc)** wired (see `js/bim-loader.js`). Everything else is queued by
priority and rationale below.

---

## Already integrated

| Library | Role on Project Genesis |
| --- | --- |
| **CesiumJS** (Apache-2.0) | Globe runtime. Terrain, 3D Tiles, KML, time-dynamic data. The twin's core. |
| **ThatOpen Components / web-ifc** (MIT / MPL-2.0) | Browser-side IFC parsing & rendering. Loaded via CDN ESM from `js/bim-loader.js`; surfaced to the LLM as the `load_bim_model` tool. |
| **OSM 3D Buildings** (via Cesium ion) | Surface-built environment context (`layers.buildings`). |
| **Google Photorealistic 3D Tiles** | High-res aerial mesh (`layers.pointcloud`). |
| **Cesium Ion Drone simulation** | Implemented in `js/drone.js`. |

## High-priority next integrations

### 1. Server-side IFC → 3D Tiles conversion
**Stack:** IfcOpenShell (LGPL-3.0) + py3dtiles + Cesium 3D Tiles.

Right now `BimLoader.loadIFC` renders the IFC inside a floating panel
overlay. The natural next step is a server job that:
- accepts an .ifc upload (or URL)
- runs `IfcOpenShell` to walk the geometry
- pipes the meshes through `py3dtiles` to emit a 3D Tiles tileset
- georeferences it from the IFC `IfcSite.RefLatitude`/`RefLongitude`
- adds the tileset directly to the Cesium globe

Outcome: BIM models become first-class entities on the parcel, not just
side-panel previews. Tool: extend `load_bim_model` with `mode: "tileset"`.

### 2. Speckle data hub
**Repo:** https://github.com/specklesystems/speckle-server (Apache-2.0)

Speckle is the open AEC data hub — Revit/Rhino/Grasshopper/IFC senders
push geometry into versioned streams. Plugging Speckle in gives the
Allerion twin a federated source for surface facilities, infrastructure
overlays, and contractor-submitted BIM without per-vendor importers.

- New tool: `speckle_load_stream(stream_id, branch)`
- New layer: `layers.speckle = []` toggled like the rest.
- The LLM can then say "show me the latest pump-house revision" and
  pull the freshest commit on a branch.

### 3. OpenUSD scene description
**Repo:** https://github.com/PixarAnimationStudios/OpenUSD (Apache-2.0)

USD is becoming the neutral interchange across NVIDIA Omniverse, Autodesk,
and industrial twins. Integrating a USD loader (via tinyusdz or
usd_view-web) lets us bring in facility-engineering scenes that aren't
IFC-native (process plant, conveyors, electrical).

### 4. xeokit-sdk dual-pane BIM
**Repo:** https://github.com/xeokit/xeokit-sdk (AGPL-3.0, commercial avail.)

For federated multi-discipline BIM review (architectural + structural +
MEP in one viewer with section planes, classification trees, IsoView),
xeokit is the strongest open option. Wire it as a *second* BIM pane,
opt-in (license consideration vs. AGPL).

### 5. PDAL + COPC point clouds
**Repo:** https://github.com/PDAL/PDAL (BSD), https://copc.io

We will get drone LiDAR for the parcel. PDAL pipelines convert LAS/LAZ →
COPC → 3D Tiles, which Cesium consumes directly. Replaces the
placeholder `layers.pointcloud` with on-prop survey data.

## Medium-priority

| Project | Why we want it |
| --- | --- |
| **iTwin.js** (MIT) — Bentley | Heavy enterprise digital-twin platform. Useful if Allerion ever publishes a federated read-only twin to DoD/USGS. |
| **Eclipse Ditto** (EPL-2.0) | Twin-runtime for sensor telemetry (drill rigs, env monitors). Pairs well with future IoT layer. |
| **buildingSMART bSDD** (MIT) | Canonical IFC classification/property dictionary. Normalize terms across vendor exports. |
| **Bonsai / BlenderBIM** (GPL-3.0) | Authoring side: repair or generate IFC inputs before ingest. |
| **MapLibre GL JS** (BSD-3-Clause) | Power the 2D inset and dual-sync view; future move off Cesium-built 2D. |
| **Three.js** (MIT) | Already a transitive dep via ThatOpen. Could host custom shaders for vein interpolation. |
| **Open3D** (MIT) | Point-cloud registration & meshing for drone surveys (server-side). |
| **FreeCAD** (LGPL-2.0) | Upstream CAD for facility design. Exports IFC via IfcOpenShell. |
| **Apache SeaTunnel** (Apache-2.0) | Pipe NURE/USGS/IoT feeds into the twin's store. |
| **PostGIS** (GPL-2.0) | Spatial DB for parcel/claim/sample tables behind the twin. |
| **Resium** (MIT) | React-on-Cesium if/when the twin moves to a component architecture. |

## Standards & specs (not code but referenced)

- **DTDL v2/v3** — https://github.com/Azure/opendigitaltwins-dtdl (MIT).
  Allerion's `azure-digital-twins-getting-started` repo already contains
  sample DTDL models. Useful as the neutral schema for the twin's
  ontology even outside Azure.
- **IFC4 / IFC4.3** — buildingSMART's open BIM standard. The reason
  ThatOpen Components / IfcOpenShell exist.
- **OGC 3D Tiles** — Cesium-originated, now OGC community standard.

## Integration patterns

```
                ┌─────────────────────────────┐
                │ Genesis AI (Workers AI)     │
                │ tool: load_bim_model(...)   │
                │ tool: speckle_load(...)     │
                │ tool: query_usgs(...)       │
                └──────────────┬──────────────┘
                               │
                ┌──────────────▼──────────────┐
                │ Allerion Digital Twin       │
                │ (Cesium · GitHub Pages)     │
                │                             │
   browser ◀──▶ │  TwinTools dispatcher       │ ◀──▶ Speckle stream
                │  BimLoader (web-ifc)        │ ◀──▶ IFC URL
                │  layers.* (Cesium entities) │ ◀──▶ USGS / Earth MRI
                └──────────────┬──────────────┘
                               │
                       (future) │
                ┌──────────────▼──────────────┐
                │ Server-side conversion      │
                │ IfcOpenShell → py3dtiles    │
                │ PDAL LAS → COPC → 3D Tiles  │
                └─────────────────────────────┘
```

## License posture

Allerion's policy: prefer permissive (MIT / Apache-2.0 / BSD / MPL).
LGPL is acceptable for server-side process boundaries (IfcOpenShell).
AGPL (xeokit) requires legal review before bundling.

## Adding to the registry

1. Add the entry to `llm-chat-app-template/src/tools.ts → BIM_REGISTRY`.
2. Add a row to this file under the appropriate section.
3. If you wire the actual integration, expose it through a new tool in
   the same `tools.ts` (matching schema), and implement the dispatcher
   in `js/twin-tools.js`.
