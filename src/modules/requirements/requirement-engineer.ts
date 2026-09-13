export type TechnicalSpecification = {
  key: string;
  value: string;
  mandatory: boolean;
  category?: "performance" | "material" | "construction" | "dimensions" | "standard" | "electrical" | "packaging" | "commercial" | "other";
  notes?: string;
};

export type SourcingRequirement = {
  productName: string;
  quantity: number;
  unit?: string;
  recurring: boolean;
  forecast?: string;
  destinationCountry: string;
  destinationCity: string;
  specifications: TechnicalSpecification[];
  requestedIncoterms: Array<"EXW" | "FOB" | "CIF" | "DDP">;
  sampleRequired: boolean;
  supplierQuestions: string[];
};

export type RequirementAssessment = {
  ready: boolean;
  completenessScore: number;
  blockingQuestions: string[];
  warnings: string[];
};

const vagueProductNames = new Set(["cnc", "cable", "machine", "printer", "robot", "sensor", "computer", "equipment"]);

export function assessRequirement(requirement: SourcingRequirement): RequirementAssessment {
  const blockingQuestions: string[] = [];
  const warnings: string[] = [];
  const mandatorySpecs = requirement.specifications.filter((spec) => spec.mandatory && spec.value.trim());
  const validQuantity = Number.isSafeInteger(requirement.quantity) && requirement.quantity > 0;
  const keys = requirement.specifications.map((spec) => spec.key.trim().toLowerCase());
  if (new Set(keys).size !== keys.length) blockingQuestions.push("Resolve duplicate specification keys before supplier discovery.");
  if (requirement.specifications.some((spec) => !spec.key.trim() || (spec.mandatory && !spec.value.trim()))) {
    blockingQuestions.push("Every specification needs a key, and mandatory specifications need a value.");
  }

  if (requirement.productName.trim().length < 3) blockingQuestions.push("Provide a specific product name/model/category.");
  if (vagueProductNames.has(requirement.productName.trim().toLowerCase()) && mandatorySpecs.length < 4) {
    blockingQuestions.push(`The product '${requirement.productName}' is too broad. Add the machine/product type and mandatory technical parameters before contacting suppliers.`);
  }
  if (mandatorySpecs.length < 3) blockingQuestions.push("Add at least three mandatory technical specifications so suppliers quote the same product basis.");
  if (!validQuantity) blockingQuestions.push("Provide a positive, whole sourcing quantity.");
  if (!requirement.destinationCountry.trim()) blockingQuestions.push("Provide the destination country.");
  if (!requirement.requestedIncoterms.length) warnings.push("No Incoterm requested; EXW/FOB/CIF/DDP comparison is recommended.");
  if (!requirement.sampleRequired) warnings.push("Sample is not requested; consider requiring one for a new supplier or technically critical product.");

  const checks = [
    requirement.productName.trim().length >= 3,
    mandatorySpecs.length >= 3,
    validQuantity,
    Boolean(requirement.destinationCountry.trim()),
    requirement.requestedIncoterms.length > 0,
    requirement.supplierQuestions.length > 0,
  ];
  const completenessScore = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  return { ready: blockingQuestions.length === 0, completenessScore, blockingQuestions, warnings };
}

export function buildSupplierBrief(requirement: SourcingRequirement) {
  const specs = requirement.specifications
    .map((spec) => `- ${spec.key}: ${spec.value}${spec.mandatory ? " [MANDATORY]" : ""}${spec.notes ? ` — ${spec.notes}` : ""}`)
    .join("\n");

  return [
    `PRODUCT: ${requirement.productName}`,
    `QUANTITY: ${requirement.quantity} ${requirement.unit ?? "units"}`,
    `RECURRING: ${requirement.recurring ? "Yes" : "No"}${requirement.forecast ? ` — ${requirement.forecast}` : ""}`,
    `DESTINATION: ${requirement.destinationCity}, ${requirement.destinationCountry}`,
    `SAMPLE REQUIRED: ${requirement.sampleRequired ? "Yes" : "No"}`,
    `REQUESTED INCOTERMS: ${requirement.requestedIncoterms.join(", ")}`,
    "",
    "TECHNICAL SPECIFICATION",
    specs,
    "",
    "SUPPLIER MUST CONFIRM",
    ...requirement.supplierQuestions.map((question, index) => `${index + 1}. ${question}`),
    "",
    "Do not substitute mandatory materials, construction or performance requirements without clearly identifying the deviation as an alternative offer.",
  ].join("\n");
}
