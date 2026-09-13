import type { ComplianceResult } from "./evaluate";

const COPPER = /\b(?:bare\s+copper|solid\s+copper|100\s*%\s*copper|bc)\b/i;
const ALTERNATIVE_METAL = /\b(?:cca|ccs|copper[-\s]+clad[-\s]+(?:alumin(?:um|ium)|steel))\b/i;

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
  const requiresCopper = COPPER.test(request) && !ALTERNATIVE_METAL.test(request);
  const containsAlternativeMetal = ALTERNATIVE_METAL.test(offer);

  if (!requiresCopper) {
    return { status: "unknown", engineeringDecisionRequired: true, reason: "Clarify the required conductor material before using the bare/solid copper assessment." };
  }

  if (requiresCopper && containsAlternativeMetal) {
    return {
      status: "non_compliant",
      engineeringDecisionRequired: true,
      reason: "Requested bare/solid copper was replaced by CCA/CCS. Keep this offer as an explicitly labelled alternative only; never rank it as technically compliant.",
    };
  }

  const offeredCopper = COPPER.test(offer) && !/\b(?:not|non)[-\s]+(?:100\s*%\s*|solid\s+|bare\s+)?copper\b/.test(offer);
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
