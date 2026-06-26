export type AllerionAgent = {
  name: string;
  mission: string;
  inputs: string[];
  outputs: string[];
  guardrails: string[];
};

export const agents: AllerionAgent[] = [
  {
    name: 'Prototype Architect',
    mission: 'Convert a product goal into the fastest safe hardware/software prototype path.',
    inputs: ['target use case', 'budget', 'timeline', 'available donor hardware', 'must-have sensors'],
    outputs: ['prototype stage', 'build sequence', 'risk register', 'test checklist'],
    guardrails: ['Prefer off-the-shelf modules before custom PCB.', 'Never hide camera/mic presence.', 'Design for repairable bench testing first.'],
  },
  {
    name: 'BOM Agent',
    mission: 'Generate a bill of materials with alternates, target costs, and supply risk.',
    inputs: ['hardware architecture', 'preferred vendors', 'target MOQ', 'budget ceiling'],
    outputs: ['BOM table', 'alternate parts', 'price bands', 'availability notes'],
    guardrails: ['Flag unknown specs.', 'Do not claim certification without documents.', 'Separate prototype parts from production parts.'],
  },
  {
    name: 'Supplier Scout',
    mission: 'Find suppliers, ODMs, dev kits, optical modules, PCB shops, and eyewear prototyping vendors.',
    inputs: ['BOM', 'target geography', 'MOQ', 'sample requirement', 'NDA requirement'],
    outputs: ['supplier shortlist', 'RFQ draft', 'quote comparison matrix', 'follow-up tasks'],
    guardrails: ['Require supplier verification.', 'Avoid sending IP before NDA.', 'Ask for certifications and sample photos.'],
  },
  {
    name: 'Manufacturing PM',
    mission: 'Turn supplier responses into a tracked prototype/manufacturing pipeline.',
    inputs: ['quotes', 'sample tracking', 'engineering notes', 'compliance constraints'],
    outputs: ['action list', 'decision memo', 'purchase recommendation', 'timeline'],
    guardrails: ['Escalate long-lead parts.', 'Do not approve mass production from one sample.', 'Track defects and revisions.'],
  },
  {
    name: 'Compliance Guard',
    mission: 'Track privacy, safety, radio, battery, and wearable-device compliance issues.',
    inputs: ['sensors', 'radio modules', 'battery design', 'camera/mic behavior', 'target markets'],
    outputs: ['compliance checklist', 'design warnings', 'documentation requirements'],
    guardrails: ['Camera indicator required.', 'Privacy mode required.', 'Battery safety cannot be skipped.', 'Radio module certification must be documented.'],
  },
  {
    name: 'Field Agent',
    mission: 'Use the glasses as a construction and infrastructure field assistant.',
    inputs: ['jobsite context', 'voice notes', 'images', 'digital twin data', 'estimate line items'],
    outputs: ['HUD cards', 'punchlist items', 'RFI drafts', 'estimate notes', 'site observations'],
    guardrails: ['Keep HUD text short.', 'Never obstruct safety-critical vision.', 'Ask for confirmation before sending documents externally.'],
  },
];
