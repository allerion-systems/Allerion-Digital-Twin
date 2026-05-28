# roofing-mcp

An MCP server that lets a roofing company sell, measure, and quote from inside any MCP-aware client (Claude Desktop, ChatGPT, Cursor, etc.) — replacing paper ledgers, in-person measure runs, and "we don't quote over the phone" with a single conversational interface.

## Tools

| Tool | What it does |
|---|---|
| `measure_roof_from_address` | Returns roof area, pitch, ridge/eave/valley/rake linear feet, story count, and facet count for a US address. Replaces in-person measure runs. |
| `get_material_prices` | Current per-unit prices from QXO, BCI, and KPHH. Optional supplier/material filter. |
| `generate_quote` | Full materials + labor + fees + markup quote. Sales rep can run this live on a call. |
| `create_lead` / `list_leads` / `update_lead` | Digital ledger replacing paper. Stored as JSON in `data/leads.json`. |
| `create_quickbooks_estimate` | Pushes a quote into QuickBooks Online as an Estimate (stub until `QBO_ACCESS_TOKEN` is set). |

## Install

```bash
cd roofing-mcp
npm install
npm run build
```

## Wire into Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "roofing": {
      "command": "node",
      "args": ["/absolute/path/to/roofing-mcp/dist/index.js"]
    }
  }
}
```

## Environment variables

| Var | Purpose |
|---|---|
| `ROOFING_MCP_DATA_DIR` | Override lead-ledger directory (default: `./data`). |
| `QBO_ACCESS_TOKEN` | OAuth2 access token for QuickBooks Online (estimate push). |
| `GOOGLE_MAPS_API_KEY` | Reserved for future Google Earth / Solar API integration. |

## What is mocked (and where the real call goes)

- **Roof measurement** (`src/measurement.ts`) — deterministic synthesis from the address. Real call: Google Earth Solar API, Nearmap AI, or EagleView.
- **Material prices** (`src/pricing.ts`) — static catalog representative of May 2026. Real call: scrape or API against the three supplier portals.
- **QuickBooks estimate** (`src/index.ts`) — returns a stub object. Real call: `POST /v3/company/{realmId}/estimate` with OAuth2.

## Monetization model

Designed to be sold to the ~10,000 existing US roofing companies, not just used in-house:

- **SaaS subscription** — per-seat access to the CRM/ledger + integrations.
- **Pay-per-report** — flat fee per `measure_roof_from_address` call.
- **Tiered access** — premium tier exposes `markupPct`, `laborRatePerSquare`, and supplier overrides so each company plugs in their own margins.
- **White-label** — license the prompt framework + MCP server so the buying company's reps generate quotes natively in their AI client of choice.
