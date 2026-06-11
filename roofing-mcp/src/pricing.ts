export type Supplier = "QXO" | "BCI" | "KPHH";

export type MaterialKey =
  | "shingles_3tab"
  | "shingles_architectural"
  | "shingles_premium"
  | "underlayment_synthetic"
  | "underlayment_felt15"
  | "ice_water_shield"
  | "ridge_cap"
  | "drip_edge"
  | "starter_strip"
  | "nails_coil";

export interface MaterialPrice {
  material: MaterialKey;
  unit: "square" | "roll" | "bundle" | "100ft" | "box";
  supplier: Supplier;
  unitPrice: number;
  fetchedAt: string;
}

// TODO: replace with live scrapes / API calls against QXO, BCI, KPHH supplier
// portals. Current prices are representative May 2026 placeholders so the
// quote math is exercisable end-to-end.
const MOCK_CATALOG: Record<Supplier, Partial<Record<MaterialKey, { unit: MaterialPrice["unit"]; unitPrice: number }>>> = {
  QXO: {
    shingles_3tab: { unit: "square", unitPrice: 105.0 },
    shingles_architectural: { unit: "square", unitPrice: 142.5 },
    shingles_premium: { unit: "square", unitPrice: 248.0 },
    underlayment_synthetic: { unit: "roll", unitPrice: 132.0 },
    ice_water_shield: { unit: "roll", unitPrice: 168.0 },
    ridge_cap: { unit: "bundle", unitPrice: 64.0 },
    drip_edge: { unit: "100ft", unitPrice: 89.0 },
    starter_strip: { unit: "bundle", unitPrice: 58.0 },
    nails_coil: { unit: "box", unitPrice: 78.0 },
  },
  BCI: {
    shingles_3tab: { unit: "square", unitPrice: 102.5 },
    shingles_architectural: { unit: "square", unitPrice: 139.0 },
    shingles_premium: { unit: "square", unitPrice: 251.0 },
    underlayment_synthetic: { unit: "roll", unitPrice: 128.0 },
    underlayment_felt15: { unit: "roll", unitPrice: 42.0 },
    ice_water_shield: { unit: "roll", unitPrice: 171.0 },
    ridge_cap: { unit: "bundle", unitPrice: 61.0 },
    drip_edge: { unit: "100ft", unitPrice: 86.0 },
    nails_coil: { unit: "box", unitPrice: 74.0 },
  },
  KPHH: {
    shingles_architectural: { unit: "square", unitPrice: 144.0 },
    shingles_premium: { unit: "square", unitPrice: 245.0 },
    underlayment_synthetic: { unit: "roll", unitPrice: 135.0 },
    ice_water_shield: { unit: "roll", unitPrice: 165.0 },
    ridge_cap: { unit: "bundle", unitPrice: 66.0 },
    drip_edge: { unit: "100ft", unitPrice: 91.0 },
    starter_strip: { unit: "bundle", unitPrice: 60.0 },
  },
};

export function getMaterialPrices(opts: {
  supplier?: Supplier;
  material?: MaterialKey;
}): MaterialPrice[] {
  const fetchedAt = new Date().toISOString();
  const suppliers: Supplier[] = opts.supplier ? [opts.supplier] : ["QXO", "BCI", "KPHH"];
  const out: MaterialPrice[] = [];
  for (const s of suppliers) {
    const entries = MOCK_CATALOG[s];
    for (const [material, info] of Object.entries(entries) as [MaterialKey, { unit: MaterialPrice["unit"]; unitPrice: number }][]) {
      if (opts.material && material !== opts.material) continue;
      out.push({ material, supplier: s, unit: info.unit, unitPrice: info.unitPrice, fetchedAt });
    }
  }
  return out;
}

export function cheapestPrice(material: MaterialKey): MaterialPrice {
  const all = getMaterialPrices({ material });
  if (all.length === 0) throw new Error(`No supplier carries ${material}`);
  return all.reduce((min, p) => (p.unitPrice < min.unitPrice ? p : min));
}

export interface QuoteInput {
  squares: number; // 1 square = 100 sqft of roof surface
  shingleType: "shingles_3tab" | "shingles_architectural" | "shingles_premium";
  ridgeLinearFeet: number;
  eaveLinearFeet: number;
  rakeLinearFeet: number;
  valleyLinearFeet: number;
  storyCount: 1 | 2 | 3;
  pitch: "low" | "medium" | "steep"; // <=6/12, 7-9/12, 10/12+
  tearOffLayers: number; // 0 = overlay, 1+ = tear off N layers
  laborRatePerSquare?: number;
  markupPct?: number; // gross margin target, default 35%
  permitFee?: number;
  dumpsterFee?: number;
}

export interface QuoteLine {
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  extended: number;
  supplier?: Supplier;
}

export interface Quote {
  lines: QuoteLine[];
  materialSubtotal: number;
  laborSubtotal: number;
  feesSubtotal: number;
  cost: number;
  markupPct: number;
  price: number;
  pricePerSquare: number;
  generatedAt: string;
}

function pitchLaborMultiplier(pitch: QuoteInput["pitch"]): number {
  return pitch === "low" ? 1.0 : pitch === "medium" ? 1.2 : 1.55;
}

function storyLaborMultiplier(stories: QuoteInput["storyCount"]): number {
  return stories === 1 ? 1.0 : stories === 2 ? 1.15 : 1.3;
}

export function generateQuote(input: QuoteInput): Quote {
  const lines: QuoteLine[] = [];

  // --- Materials ---
  const shingle = cheapestPrice(input.shingleType);
  // Shingle waste factor 10% on cuts.
  const shingleSquares = Math.ceil(input.squares * 1.1);
  lines.push({
    description: `${input.shingleType.replace("shingles_", "")} shingles`,
    quantity: shingleSquares,
    unit: "square",
    unitCost: shingle.unitPrice,
    extended: shingleSquares * shingle.unitPrice,
    supplier: shingle.supplier,
  });

  const underlayment = cheapestPrice("underlayment_synthetic");
  // 1 roll covers ~10 squares.
  const underlaymentRolls = Math.ceil(input.squares / 10);
  lines.push({
    description: "Synthetic underlayment",
    quantity: underlaymentRolls,
    unit: "roll",
    unitCost: underlayment.unitPrice,
    extended: underlaymentRolls * underlayment.unitPrice,
    supplier: underlayment.supplier,
  });

  const iceShield = cheapestPrice("ice_water_shield");
  // Ice and water along eaves + valleys; 1 roll covers ~65 linear ft at 36" wide doubled.
  const iceShieldRolls = Math.ceil((input.eaveLinearFeet + input.valleyLinearFeet) / 65);
  if (iceShieldRolls > 0) {
    lines.push({
      description: "Ice & water shield",
      quantity: iceShieldRolls,
      unit: "roll",
      unitCost: iceShield.unitPrice,
      extended: iceShieldRolls * iceShield.unitPrice,
      supplier: iceShield.supplier,
    });
  }

  const ridgeCap = cheapestPrice("ridge_cap");
  // 1 bundle covers ~35 linear feet of ridge.
  const ridgeCapBundles = Math.ceil(input.ridgeLinearFeet / 35);
  lines.push({
    description: "Ridge cap shingles",
    quantity: ridgeCapBundles,
    unit: "bundle",
    unitCost: ridgeCap.unitPrice,
    extended: ridgeCapBundles * ridgeCap.unitPrice,
    supplier: ridgeCap.supplier,
  });

  const dripEdge = cheapestPrice("drip_edge");
  // Drip edge along eaves and rakes; price is per 100 ft.
  const dripEdge100ft = Math.ceil((input.eaveLinearFeet + input.rakeLinearFeet) / 100);
  lines.push({
    description: "Drip edge",
    quantity: dripEdge100ft,
    unit: "100ft",
    unitCost: dripEdge.unitPrice,
    extended: dripEdge100ft * dripEdge.unitPrice,
    supplier: dripEdge.supplier,
  });

  const nails = cheapestPrice("nails_coil");
  // 1 box of coil nails per ~15 squares of install.
  const nailBoxes = Math.max(1, Math.ceil(input.squares / 15));
  lines.push({
    description: "Coil roofing nails",
    quantity: nailBoxes,
    unit: "box",
    unitCost: nails.unitPrice,
    extended: nailBoxes * nails.unitPrice,
    supplier: nails.supplier,
  });

  const materialSubtotal = lines.reduce((sum, l) => sum + l.extended, 0);

  // --- Labor ---
  const baseLaborRate = input.laborRatePerSquare ?? 175;
  const laborMultiplier =
    pitchLaborMultiplier(input.pitch) * storyLaborMultiplier(input.storyCount);
  const laborPerSquare = baseLaborRate * laborMultiplier;
  const installLabor = input.squares * laborPerSquare;
  lines.push({
    description: `Install labor (pitch=${input.pitch}, stories=${input.storyCount})`,
    quantity: input.squares,
    unit: "square",
    unitCost: laborPerSquare,
    extended: installLabor,
  });

  let tearOffLabor = 0;
  if (input.tearOffLayers > 0) {
    const tearOffRate = 65 * input.tearOffLayers;
    tearOffLabor = input.squares * tearOffRate;
    lines.push({
      description: `Tear-off labor (${input.tearOffLayers} layer${input.tearOffLayers > 1 ? "s" : ""})`,
      quantity: input.squares,
      unit: "square",
      unitCost: tearOffRate,
      extended: tearOffLabor,
    });
  }

  const laborSubtotal = installLabor + tearOffLabor;

  // --- Fees ---
  const permitFee = input.permitFee ?? 285;
  const dumpsterFee =
    input.dumpsterFee ?? (input.tearOffLayers > 0 ? 525 : 0);
  if (permitFee > 0) {
    lines.push({
      description: "Permit fee",
      quantity: 1,
      unit: "each",
      unitCost: permitFee,
      extended: permitFee,
    });
  }
  if (dumpsterFee > 0) {
    lines.push({
      description: "Dumpster / disposal",
      quantity: 1,
      unit: "each",
      unitCost: dumpsterFee,
      extended: dumpsterFee,
    });
  }
  const feesSubtotal = permitFee + dumpsterFee;

  const cost = materialSubtotal + laborSubtotal + feesSubtotal;
  const markupPct = input.markupPct ?? 35;
  const price = cost / (1 - markupPct / 100);

  return {
    lines,
    materialSubtotal: round2(materialSubtotal),
    laborSubtotal: round2(laborSubtotal),
    feesSubtotal: round2(feesSubtotal),
    cost: round2(cost),
    markupPct,
    price: round2(price),
    pricePerSquare: round2(price / input.squares),
    generatedAt: new Date().toISOString(),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
