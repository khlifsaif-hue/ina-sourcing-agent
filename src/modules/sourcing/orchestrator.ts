import { assessRequirement, type SourcingRequirement } from "@/modules/requirements/requirement-engineer";
import { runSupplierDiscovery, qualifyCandidate, type SupplierSearchProvider } from "@/modules/sourcing/discovery-agent";

export type SourcingStage = "requirement" | "discovery" | "qualification" | "rfq" | "quotation" | "compliance" | "negotiation" | "sample" | "landed-cost" | "decision";

export type SourcingRunSummary = {
  stage: SourcingStage;
  status: "blocked" | "running" | "awaiting-rfq" | "ready-for-review";
  requirementScore: number;
  suppliersFound: number;
  suppliersQualified: number;
  publishedPrices: number;
  rfqRequired: number;
  blockingQuestions: string[];
  warnings: string[];
};

export async function runSourcingOrchestrator(provider: SupplierSearchProvider, requirement: SourcingRequirement): Promise<SourcingRunSummary> {
  const assessment = assessRequirement(requirement);
  if (!assessment.ready) {
    return {
      stage: "requirement",
      status: "blocked",
      requirementScore: assessment.completenessScore,
      suppliersFound: 0,
      suppliersQualified: 0,
      publishedPrices: 0,
      rfqRequired: 0,
      blockingQuestions: assessment.blockingQuestions,
      warnings: assessment.warnings,
    };
  }

  const discovery = await runSupplierDiscovery(provider, {
    product: requirement.productName,
    specifications: requirement.specifications.map((spec) => ({ key: spec.key, value: spec.value, mandatory: spec.mandatory })),
    quantity: requirement.quantity,
    destination: `${requirement.destinationCity}, ${requirement.destinationCountry}`,
  });

  const qualified = discovery.candidates.filter((candidate) => qualifyCandidate(candidate).qualified);
  const publishedPrices = qualified.filter((candidate) => candidate.price).length;
  const rfqRequired = qualified.length - publishedPrices;

  return {
    stage: rfqRequired > 0 ? "rfq" : "qualification",
    status: rfqRequired > 0 ? "awaiting-rfq" : "ready-for-review",
    requirementScore: assessment.completenessScore,
    suppliersFound: discovery.candidates.length,
    suppliersQualified: qualified.length,
    publishedPrices,
    rfqRequired,
    blockingQuestions: [],
    warnings: [...assessment.warnings, ...discovery.warnings],
  };
}
