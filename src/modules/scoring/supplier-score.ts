import { rankSupplier } from "./rank";

export type SupplierScoreInput = {
  technical: number;
  price: number;
  credibility: number;
  leadTime: number;
  commercial: number;
};

// Compatibility adapter. Ranking weights have a single source in rank.ts.
// Use rankSupplier().eligibleForRecommendation when selecting a supplier.
export function calculateSupplierScore(input: SupplierScoreInput): number {
  return rankSupplier({
    technicalCompliance: input.technical,
    landedCost: input.price,
    credibility: input.credibility,
    leadTime: input.leadTime,
    commercialTerms: input.commercial,
    mandatoryDeviation: true,
  }).total;
}
