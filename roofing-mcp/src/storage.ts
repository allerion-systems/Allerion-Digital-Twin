import { promises as fs } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.ROOFING_MCP_DATA_DIR ?? join(__dirname, "..", "data");
const LEADS_PATH = join(DATA_DIR, "leads.json");

export type LeadStatus =
  | "new"
  | "contacted"
  | "measured"
  | "quoted"
  | "won"
  | "lost";

export interface Lead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address: string;
  status: LeadStatus;
  notes?: string;
  measurementId?: string;
  quoteId?: string;
  createdAt: string;
  updatedAt: string;
}

async function readAll(): Promise<Lead[]> {
  try {
    const raw = await fs.readFile(LEADS_PATH, "utf8");
    return JSON.parse(raw) as Lead[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function writeAll(leads: Lead[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(LEADS_PATH, JSON.stringify(leads, null, 2), "utf8");
}

export async function createLead(input: Omit<Lead, "id" | "status" | "createdAt" | "updatedAt"> & {
  status?: LeadStatus;
}): Promise<Lead> {
  const now = new Date().toISOString();
  const lead: Lead = {
    id: randomUUID(),
    status: input.status ?? "new",
    createdAt: now,
    updatedAt: now,
    name: input.name,
    address: input.address,
    phone: input.phone,
    email: input.email,
    notes: input.notes,
    measurementId: input.measurementId,
    quoteId: input.quoteId,
  };
  const leads = await readAll();
  leads.push(lead);
  await writeAll(leads);
  return lead;
}

export async function listLeads(filter?: { status?: LeadStatus }): Promise<Lead[]> {
  const leads = await readAll();
  if (!filter?.status) return leads;
  return leads.filter((l) => l.status === filter.status);
}

export async function getLead(id: string): Promise<Lead | undefined> {
  const leads = await readAll();
  return leads.find((l) => l.id === id);
}

export async function updateLead(
  id: string,
  patch: Partial<Omit<Lead, "id" | "createdAt">>,
): Promise<Lead> {
  const leads = await readAll();
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) throw new Error(`Lead ${id} not found`);
  const updated: Lead = {
    ...leads[idx],
    ...patch,
    id: leads[idx].id,
    createdAt: leads[idx].createdAt,
    updatedAt: new Date().toISOString(),
  };
  leads[idx] = updated;
  await writeAll(leads);
  return updated;
}
