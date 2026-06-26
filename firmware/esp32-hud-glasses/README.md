# ESP32 / nRF52 HUD Glasses Firmware Spec

This is the starter firmware contract for the first ALLERION HUD prototype.

## Hardware target

Use one of these for the first bench prototype:

- ESP32-S3 dev board
- nRF52840 dev board
- Seeed XIAO ESP32S3 / XIAO nRF52840
- Adafruit Feather nRF52840

## BLE service

Service UUID:

```txt
7f4b0001-8e7c-4f7a-91a7-a11e71000001
```

HUD card characteristic UUID:

```txt
7f4b0002-8e7c-4f7a-91a7-a11e71000002
```

Expected payload:

```json
{
  "type": "hud.card",
  "issuedAt": "2026-06-25T00:00:00.000Z",
  "card": {
    "title": "ALLERION",
    "body": "Prototype HUD online",
    "priority": "normal",
    "ttlSeconds": 10
  }
}
```

## Firmware loop

1. Advertise as `ALLERION-HUD-DEV`.
2. Accept BLE connection from mobile app.
3. Receive HUD card JSON.
4. Render `title` and `body` to display.
5. Clear display after `ttlSeconds`.
6. If priority is `urgent`, flash border / icon three times.

## Display options

Fastest options:

- tiny I2C OLED display for bench test
- monocular prism display module
- LCOS/micro-OLED eval module

Do not start with custom waveguides. Validate the software and display protocol first.

## Safety requirements

- HUD text must be short and non-blocking.
- No full-screen overlays during equipment operation.
- Camera prototypes need visible recording indicator.
- Battery charging must use protected cells and safe charge boards.
