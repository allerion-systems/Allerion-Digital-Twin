# ALLERION HUD Manufacturing Agent Playbook

## Goal

Build agents that help source, prototype, and eventually manufacture ALLERION AI HUD glasses.

The agents should not pretend to be magic. They should produce structured manufacturing work product:

- BOMs
- RFQs
- supplier shortlists
- quote comparison tables
- risk registers
- compliance checklists
- prototype test plans
- purchase recommendations

## Prototype strategy

### Stage 1 — Donor hardware workflow validation

Use off-the-shelf camera/audio smart glasses, a phone, or a clip-on camera to validate the AI workflow.

Deliverables:

- mobile app
- voice note capture
- image/context capture
- AI agent response
- field HUD/audio summary

### Stage 2 — BLE HUD dev kit

Build a simple wearable display that only receives HUD cards from the phone.

Parts:

- ESP32-S3 or nRF52840
- tiny OLED / microdisplay
- LiPo battery + charge/protection board
- 3D printed/donor frame
- one physical input

Deliverables:

- BLE connection
- HUD card render
- urgent card behavior
- battery runtime notes
- enclosure/frame notes

### Stage 3 — Integrated AI glasses prototype

Add sensors and industrial design.

Parts:

- camera module
- mic array
- speakers / bone conduction
- radio module
- display optics
- custom PCB
- enclosure/frame

Deliverables:

- prototype CAD
- custom PCB design package
- firmware build
- privacy indicator
- compliance plan
- manufacturing RFQ package

## Agent workflow

```txt
User goal
  ↓
Prototype Architect
  ↓
BOM Agent
  ↓
Supplier Scout
  ↓
Manufacturing PM
  ↓
Compliance Guard
  ↓
Purchase / prototype decision
```

## Supplier RFQ template

Subject: Sample RFQ for AI HUD glasses prototype components

Hello,

We are developing an AI HUD smart-glasses prototype and are looking for sample components and potential production support.

Please provide:

1. Sample availability
2. Unit price at 1, 10, 100, 1,000, and 10,000 units
3. MOQ
4. Lead time
5. Datasheet
6. Certifications
7. Interface details
8. Mechanical drawings
9. Whether NDA is required
10. Whether you support custom integration / ODM services

Target use case: lightweight field-assistance glasses for construction and industrial workflows.

Thank you,
ALLERION Technologies

## Data model

```ts
type Supplier = {
  name: string;
  website: string;
  category: 'mcu' | 'display' | 'optics' | 'battery' | 'camera' | 'frame' | 'odm' | 'pcb';
  country?: string;
  contactEmail?: string;
  moq?: string;
  samplePrice?: string;
  leadTime?: string;
  certifications?: string[];
  risk: 'low' | 'medium' | 'high';
  notes: string;
};
```

## Red flags

- Supplier refuses datasheets.
- Supplier cannot explain display interface.
- Camera hardware has no privacy indicator plan.
- Battery pack has no protection circuit.
- ODM asks for full payment before sample validation.
- MOQ is pushed before prototype success.
- Claims FCC/CE/RoHS without documents.

## First 7-day sprint

Day 1: run app + API locally.
Day 2: connect phone to BLE dev board.
Day 3: render HUD card on OLED.
Day 4: build first BOM.
Day 5: send RFQs to component suppliers.
Day 6: compare quotes and order sample parts.
Day 7: record demo: phone app → agent → HUD card → display.
