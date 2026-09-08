import type { ComplianceResult } from "./evaluate";

const COPPER_TERMS = ["bare copper", "solid copper", "100% copper", "bc"];
const NON_COPPER_TERMS = ["cca", "copper clad aluminum", "copper-clad aluminum", "ccs", "copper clad steel"];

export type ConductorAssessment = {
  status: ComplianceResult["status"];
  engineeringDecisionRequired: boolean;
  reason: string;
};

export function assessCat6Conductor(requested: string, offered?: string): ConductorAssessment {
  if (!offered?.trim()) {
    return {
      status: "unknown",
      engineeringDecisionRequired: true,
      reason: "Supplier conductor material is missing and must be confirmed before commercial comparison.",
    };
  }

  const request = requested.toLowerCase();
  const offer = offered.toLowerCase();
  const requiresCopper = COPPER_TERMS.some((term) => request.includes(term));
  const containsAlternativeMetal = NON_COPPER_TERMS.some((term) => offer.includes(term));

  if (requiresCopper && containsAlternativeMetal) {
    return {
      status: "non_compliant",
      engineeringDecisionRequired: true,
      reason: "Requested bare/solid copper was replaced by CCA/CCS. Keep this offer as an explicitly labelled alternative only; never rank it as technically compliant.",
    };
  }

  const offeredCopper = COPPER_TERMS.some((term) => offer.includes(term));
  if (requiresCopper && !offeredCopper) {
    return {
      status: "unknown",
      engineeringDecisionRequired: true,
      reason: "The offer does not clearly prove a bare/solid copper conductor. Request conductor construction and material evidence.",
    };
  }

  return {
    status: "compliant",
    engineeringDecisionRequired: false,
    reason: "Offered conductor is consistent with the requested copper construction.",
  };
}
