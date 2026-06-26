# ALLERION HUD Glasses

AI HUD glasses platform for construction, field work, estimating, digital twins, and manufacturing-agent workflows.

This repo is scaffolded as a practical prototype stack:

- `apps/mobile` — React Native / Expo app that connects to prototype glasses over BLE.
- `apps/api` — FastAPI backend for agents, device sessions, command routing, and sourcing workflows.
- `packages/agent-core` — agent definitions for sourcing, BOM generation, supplier outreach, compliance tracking, and prototype build planning.
- `firmware/esp32-hud-glasses` — starter firmware spec for a cheap ESP32/nRF52-style BLE HUD prototype.
- `docs` — manufacturing playbooks, hardware roadmap, and prototype strategy.

## Product vision

ALLERION HUD turns smart glasses into a field AI operating system:

1. Capture first-person context from camera, mic, location, and jobsite documents.
2. Send intent-level context to AI agents instead of streaming raw video constantly.
3. Return short, safe, glanceable HUD cards to the glasses.
4. Use the same agent system to source parts, build BOMs, contact vendors, compare suppliers, and prepare manufacturing packages.

## MVP architecture

```txt
Glasses prototype
  ├─ BLE display service
  ├─ button / touch input
  ├─ optional camera/mic module
  └─ low-power firmware
        │
        ▼
Mobile app
  ├─ device pairing
  ├─ HUD command queue
  ├─ voice capture
  ├─ field mode workflows
  └─ agent chat
        │
        ▼
Cloud API
  ├─ session router
  ├─ agent orchestrator
  ├─ supplier research agent
  ├─ BOM agent
  ├─ compliance agent
  └─ manufacturing packet generator
```

## First build target

Build a non-display AI glasses prototype first, then HUD:

### Prototype A — fastest demo

- Buy cheap camera/audio smart glasses or clip-on camera.
- Use the phone app as the AI brain.
- Push instructions/audio feedback to earbuds or phone.
- Validate workflows before custom optics.

### Prototype B — simple HUD

- ESP32-S3 or nRF52840 controller.
- BLE bridge to phone.
- Tiny OLED / microdisplay module.
- One button or touch strip.
- Show 1–3 line HUD cards.

### Prototype C — manufacturable smart glasses

- Custom PCB.
- Battery management.
- Camera, mic array, speaker/bone conduction.
- Optical module / waveguide / prism display.
- Injection-molded or 3D-printed frame iterations.

## Core agent jobs

- **Prototype Architect** — turns goals into hardware/software prototype plan.
- **BOM Agent** — generates parts lists, alternates, target prices, and risk notes.
- **Supplier Scout** — finds OEM/ODM/component suppliers and drafts outreach.
- **Manufacturing PM** — tracks samples, quotes, lead times, compliance docs, and next actions.
- **Compliance Guard** — tracks privacy, camera indicator, FCC/CE/UL/RoHS, battery, and safety constraints.
- **Field Agent** — jobsite assistant for punchlists, estimating, RFIs, and digital twin capture.

## Local development

```bash
# API
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8080

# Mobile
cd apps/mobile
npm install
npx expo start
```

## Immediate next steps

1. Get the mobile app running.
2. Connect to a BLE development board.
3. Send a test HUD card from app to board.
4. Add agent-backed BOM generation.
5. Use the BOM output to source prototype parts.
