// ERPNext (Frappe) connector — stub.
//
// Real API surface:
//   POST {ERPNEXT_BASE_URL}/api/resource/Customer
//   POST {ERPNEXT_BASE_URL}/api/resource/Quotation
//   POST {ERPNEXT_BASE_URL}/api/resource/Project
//
// Auth: header `Authorization: token {ERPNEXT_API_KEY}:{ERPNEXT_API_SECRET}`.
// Docs: https://frappeframework.com/docs/user/en/api/rest
//
// Today this module returns deterministic stub payloads so the MCP tools are
// fully exercisable without an ERPNext instance. When ERPNEXT_BASE_URL,
// ERPNEXT_API_KEY, and ERPNEXT_API_SECRET are all set, the live branch should
// take over (TODO).

import type { Lead } from "./storage.js";
import type { Quote } from "./pricing.js";

export interface ErpNextCustomer {
  name: string; // Frappe doc ID
  customer_name: string;
  customer_type: "Individual" | "Company";
  customer_group: string;
  territory: string;
  mobile_no?: string;
  email_id?: string;
  primary_address?: string;
}

export interface ErpNextQuotationItem {
  item_code: string;
  description: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
}

export interface ErpNextQuotation {
  name: string; // Frappe doc ID e.g. SAL-QTN-2026-00001
  party_name: string; // customer doc id
  transaction_date: string; // YYYY-MM-DD
  valid_till: string;
  items: ErpNextQuotationItem[];
  total: number;
  grand_total: number;
  status: "Draft" | "Submitted";
}

export interface ErpNextProject {
  name: string;
  project_name: string;
  customer: string;
  status: "Open" | "Completed";
  expected_start_date: string;
  expected_end_date?: string;
}

function isConfigured(): boolean {
  return Boolean(
    process.env.ERPNEXT_BASE_URL &&
      process.env.ERPNEXT_API_KEY &&
      process.env.ERPNEXT_API_SECRET,
  );
}

function stubId(prefix: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  return `${prefix}-${ts}`;
}

export async function createCustomer(lead: Lead): Promise<ErpNextCustomer> {
  if (isConfigured()) {
    // TODO: real POST to /api/resource/Customer
    throw new Error("Live ERPNext integration not implemented yet.");
  }
  return {
    name: stubId("CUST"),
    customer_name: lead.name,
    customer_type: "Individual",
    customer_group: "All Customer Groups",
    territory: "All Territories",
    mobile_no: lead.phone,
    email_id: lead.email,
    primary_address: lead.address,
  };
}

export async function createQuotation(
  customerId: string,
  quote: Quote,
): Promise<ErpNextQuotation> {
  if (isConfigured()) {
    // TODO: real POST to /api/resource/Quotation
    throw new Error("Live ERPNext integration not implemented yet.");
  }

  const items: ErpNextQuotationItem[] = quote.lines.map((l, i) => ({
    item_code: `ROOF-${String(i + 1).padStart(3, "0")}`,
    description: l.description,
    qty: l.quantity,
    uom: l.unit,
    rate: l.unitCost,
    amount: l.extended,
  }));

  const today = new Date().toISOString().slice(0, 10);
  const validTill = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return {
    name: stubId("SAL-QTN"),
    party_name: customerId,
    transaction_date: today,
    valid_till: validTill,
    items,
    total: quote.cost,
    grand_total: quote.price,
    status: "Draft",
  };
}

export async function createProject(
  customerId: string,
  projectName: string,
): Promise<ErpNextProject> {
  if (isConfigured()) {
    // TODO: real POST to /api/resource/Project
    throw new Error("Live ERPNext integration not implemented yet.");
  }
  return {
    name: stubId("PROJ"),
    project_name: projectName,
    customer: customerId,
    status: "Open",
    expected_start_date: new Date().toISOString().slice(0, 10),
  };
}

export function configStatus(): { configured: boolean; missing: string[] } {
  const required = ["ERPNEXT_BASE_URL", "ERPNEXT_API_KEY", "ERPNEXT_API_SECRET"];
  const missing = required.filter((k) => !process.env[k]);
  return { configured: missing.length === 0, missing };
}
