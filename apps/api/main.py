from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ALLERION HUD Agent API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ManufacturingAgentRequest(BaseModel):
    prompt: str = Field(..., min_length=3)
    target_stage: Literal["prototype_a", "prototype_b", "prototype_c"] = "prototype_b"


class HudCommand(BaseModel):
    title: str
    body: str
    priority: Literal["low", "normal", "urgent"] = "normal"
    ttl_seconds: int = 10


@app.get("/health")
def health():
    return {"ok": True, "service": "allerion-hud-agent-api", "timestamp": datetime.utcnow().isoformat()}


@app.post("/hud/cards")
def create_hud_card(command: HudCommand):
    """Queue a HUD card for the mobile app / glasses bridge.

    In production this should publish to Redis, Supabase Realtime, MQTT, or a device-session websocket.
    """
    return {
        "queued": True,
        "command": command.model_dump(),
        "next_transport": "mobile_ble_bridge",
    }


@app.post("/agents/manufacturing/run")
def run_manufacturing_agent(request: ManufacturingAgentRequest):
    """Deterministic first-pass manufacturing agent.

    Replace this with a real LLM + tools later. The important part is the output contract:
    decisions, BOM, supplier tasks, compliance tasks, and next physical action.
    """
    stage = request.target_stage
    recommended_path = {
        "prototype_a": "Validate AI workflow using off-the-shelf camera/audio glasses and phone compute.",
        "prototype_b": "Build BLE HUD dev kit with ESP32-S3/nRF52840, OLED/microdisplay, battery, and button input.",
        "prototype_c": "Package custom PCB, optics, battery, enclosure, firmware, and compliance documents for ODM quotes.",
    }[stage]

    bom = [
        {"part": "BLE MCU dev board", "target": "ESP32-S3 or nRF52840", "why": "cheap, available, enough for HUD bridge"},
        {"part": "Microdisplay", "target": "0.39in OLED / LCOS eval module", "why": "simple glanceable HUD testing"},
        {"part": "Battery", "target": "200-500 mAh LiPo with charger/protection", "why": "wearable prototype runtime"},
        {"part": "Input", "target": "single button or capacitive touch strip", "why": "low complexity interaction"},
        {"part": "Frame", "target": "3D printed glasses frame or donor safety glasses", "why": "fast iteration before tooling"},
    ]

    supplier_tasks = [
        "Find 3 MCU/module suppliers with dev kits available now.",
        "Find 3 microdisplay or prism/HUD module suppliers willing to sell samples.",
        "Find 2 industrial design / eyewear prototyping vendors for frame iterations.",
        "Draft RFQ asking for MOQ, unit price at 100/1,000/10,000, sample lead time, certifications, and NDA terms.",
    ]

    compliance_tasks = [
        "Add visible recording indicator if camera is used.",
        "Track FCC/CE radio module certification path.",
        "Use protected battery pack and document charge/discharge safety.",
        "Avoid always-on raw video streaming; prefer intent-aware snapshots/events.",
    ]

    summary = f"""
Recommended path: {recommended_path}

BOM starter:
""".strip()
    summary += "\n" + "\n".join([f"- {item['part']}: {item['target']} — {item['why']}" for item in bom])
    summary += "\n\nSupplier tasks:\n" + "\n".join([f"- {task}" for task in supplier_tasks])
    summary += "\n\nCompliance guardrails:\n" + "\n".join([f"- {task}" for task in compliance_tasks])
    summary += "\n\nNext physical action: order one BLE MCU board, one tiny display module, one LiPo charger board, and build the HUD-card BLE demo first."

    return {
        "summary": summary,
        "stage": stage,
        "bom": bom,
        "supplier_tasks": supplier_tasks,
        "compliance_tasks": compliance_tasks,
        "created_at": datetime.utcnow().isoformat(),
    }
