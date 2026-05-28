#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { measureRoofFromAddress } from "./measurement.js";
import { generateQuote, getMaterialPrices } from "./pricing.js";
import {
  createLead,
  getLead,
  listLeads,
  updateLead,
  type LeadStatus,
} from "./storage.js";

const server = new Server(
  { name: "roofing-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

const TOOLS: Tool[] = [
  {
    name: "measure_roof_from_address",
    description:
      "Generate a remote roof measurement (area, pitch, ridge/eave/valley linear feet) for a US street address using satellite imagery. Replaces in-person property visits.",
    inputSchema: {
      type: "object",
      properties: {
        address: { type: "string", description: "Full street address" },
      },
      required: ["address"],
    },
  },
  {
    name: "get_material_prices",
    description:
      "Fetch current per-unit roofing material prices from QXO, BCI, and KPHH. Optional supplier or material filter.",
    inputSchema: {
      type: "object",
      properties: {
        supplier: { type: "string", enum: ["QXO", "BCI", "KPHH"] },
        material: {
          type: "string",
          enum: [
            "shingles_3tab",
            "shingles_architectural",
            "shingles_premium",
            "underlayment_synthetic",
            "underlayment_felt15",
            "ice_water_shield",
            "ridge_cap",
            "drip_edge",
            "starter_strip",
            "nails_coil",
          ],
        },
      },
    },
  },
  {
    name: "generate_quote",
    description:
      "Build a fully-priced roofing quote (materials + labor + fees) from measurement inputs. Sales reps can run this live on a phone call.",
    inputSchema: {
      type: "object",
      properties: {
        squares: { type: "number", description: "Roof area in squares (100 sqft units)" },
        shingleType: {
          type: "string",
          enum: ["shingles_3tab", "shingles_architectural", "shingles_premium"],
        },
        ridgeLinearFeet: { type: "number" },
        eaveLinearFeet: { type: "number" },
        rakeLinearFeet: { type: "number" },
        valleyLinearFeet: { type: "number" },
        storyCount: { type: "number", enum: [1, 2, 3] },
        pitch: { type: "string", enum: ["low", "medium", "steep"] },
        tearOffLayers: { type: "number", description: "0 = overlay, 1+ = layers to tear off" },
        laborRatePerSquare: { type: "number" },
        markupPct: { type: "number", description: "Gross-margin target (default 35)" },
        permitFee: { type: "number" },
        dumpsterFee: { type: "number" },
      },
      required: [
        "squares",
        "shingleType",
        "ridgeLinearFeet",
        "eaveLinearFeet",
        "rakeLinearFeet",
        "valleyLinearFeet",
        "storyCount",
        "pitch",
        "tearOffLayers",
      ],
    },
  },
  {
    name: "create_lead",
    description: "Create a customer lead in the digital ledger (replaces paper).",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        address: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        notes: { type: "string" },
        measurementId: { type: "string" },
        quoteId: { type: "string" },
        status: {
          type: "string",
          enum: ["new", "contacted", "measured", "quoted", "won", "lost"],
        },
      },
      required: ["name", "address"],
    },
  },
  {
    name: "list_leads",
    description: "List leads from the digital ledger, optionally filtered by status.",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["new", "contacted", "measured", "quoted", "won", "lost"],
        },
      },
    },
  },
  {
    name: "update_lead",
    description: "Update a lead's status, notes, or linked measurement/quote IDs.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        status: {
          type: "string",
          enum: ["new", "contacted", "measured", "quoted", "won", "lost"],
        },
        notes: { type: "string" },
        measurementId: { type: "string" },
        quoteId: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "create_quickbooks_estimate",
    description:
      "Push a generated quote into QuickBooks Online as an Estimate. Returns the QB estimate ID. (Stub: requires QBO_ACCESS_TOKEN to make live calls.)",
    inputSchema: {
      type: "object",
      properties: {
        leadId: { type: "string" },
        quote: { type: "object" },
      },
      required: ["leadId", "quote"],
    },
  },
];

const MeasureArgs = z.object({ address: z.string().min(3) });

const MaterialPricesArgs = z.object({
  supplier: z.enum(["QXO", "BCI", "KPHH"]).optional(),
  material: z
    .enum([
      "shingles_3tab",
      "shingles_architectural",
      "shingles_premium",
      "underlayment_synthetic",
      "underlayment_felt15",
      "ice_water_shield",
      "ridge_cap",
      "drip_edge",
      "starter_strip",
      "nails_coil",
    ])
    .optional(),
});

const QuoteArgs = z.object({
  squares: z.number().positive(),
  shingleType: z.enum(["shingles_3tab", "shingles_architectural", "shingles_premium"]),
  ridgeLinearFeet: z.number().nonnegative(),
  eaveLinearFeet: z.number().nonnegative(),
  rakeLinearFeet: z.number().nonnegative(),
  valleyLinearFeet: z.number().nonnegative(),
  storyCount: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  pitch: z.enum(["low", "medium", "steep"]),
  tearOffLayers: z.number().int().nonnegative(),
  laborRatePerSquare: z.number().positive().optional(),
  markupPct: z.number().min(0).max(80).optional(),
  permitFee: z.number().nonnegative().optional(),
  dumpsterFee: z.number().nonnegative().optional(),
});

const LeadStatusEnum = z.enum([
  "new",
  "contacted",
  "measured",
  "quoted",
  "won",
  "lost",
]);

const CreateLeadArgs = z.object({
  name: z.string().min(1),
  address: z.string().min(3),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  notes: z.string().optional(),
  measurementId: z.string().optional(),
  quoteId: z.string().optional(),
  status: LeadStatusEnum.optional(),
});

const ListLeadsArgs = z.object({ status: LeadStatusEnum.optional() });

const UpdateLeadArgs = z.object({
  id: z.string(),
  status: LeadStatusEnum.optional(),
  notes: z.string().optional(),
  measurementId: z.string().optional(),
  quoteId: z.string().optional(),
});

const QboEstimateArgs = z.object({
  leadId: z.string(),
  quote: z.record(z.unknown()),
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  try {
    switch (name) {
      case "measure_roof_from_address": {
        const { address } = MeasureArgs.parse(args);
        const measurement = await measureRoofFromAddress(address);
        return ok(measurement);
      }
      case "get_material_prices": {
        const parsed = MaterialPricesArgs.parse(args ?? {});
        return ok(getMaterialPrices(parsed));
      }
      case "generate_quote": {
        const parsed = QuoteArgs.parse(args);
        return ok(generateQuote(parsed));
      }
      case "create_lead": {
        const parsed = CreateLeadArgs.parse(args);
        const lead = await createLead(parsed);
        return ok(lead);
      }
      case "list_leads": {
        const parsed = ListLeadsArgs.parse(args ?? {});
        return ok(await listLeads(parsed.status ? { status: parsed.status as LeadStatus } : undefined));
      }
      case "update_lead": {
        const { id, ...patch } = UpdateLeadArgs.parse(args);
        const existing = await getLead(id);
        if (!existing) return error(`Lead ${id} not found`);
        return ok(await updateLead(id, patch));
      }
      case "create_quickbooks_estimate": {
        const { leadId, quote } = QboEstimateArgs.parse(args);
        const lead = await getLead(leadId);
        if (!lead) return error(`Lead ${leadId} not found`);
        // TODO: real QBO call:
        //   POST https://quickbooks.api.intuit.com/v3/company/{realmId}/estimate
        //   with OAuth2 access token in Authorization header.
        if (!process.env.QBO_ACCESS_TOKEN) {
          return ok({
            stub: true,
            note: "Set QBO_ACCESS_TOKEN to push estimates to QuickBooks Online.",
            previewEstimateId: `STUB-${Date.now()}`,
            customer: { name: lead.name, address: lead.address },
            quote,
          });
        }
        return error("Live QuickBooks integration not yet implemented.");
      }
      default:
        return error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
});

function ok(payload: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
  };
}

function error(message: string) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // eslint-disable-next-line no-console
  console.error("roofing-mcp listening on stdio");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal:", err);
  process.exit(1);
});
