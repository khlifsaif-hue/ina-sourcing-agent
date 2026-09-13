export type SupplierScoreInput = {
  technicalCompliance: number;
  landedCost: number;
  credibility: number;
  leadTime: number;
  commercialTerms: number;
  mandatoryDeviation: boolean;
};

export type SupplierScore = SupplierScoreInput & {
  total: number;
  eligibleForRecommendation: boolean;
};

// Single source of truth for supplier ranking.
// Technical compliance remains both the highest weighted factor and a hard gate.
export const supplierScoreWeights = {
  technicalCompliance: 0.35,
  landedCost: 0.30,
  credibility: 0.15,
  leadTime: 0.10,
  commercialTerms: 0.10,
} as const;

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function rankSupplier(input: SupplierScoreInput): SupplierScore {
  const technicalCompliance = clamp(input.technicalCompliance);
  const landedCost = clamp(input.landedCost);
  const credibility = clamp(input.credibility);
  const leadTime = clamp(input.leadTime);
  const commercialTerms = clamp(input.commercialTerms);

  // A cheaper offer can never compensate for a mandatory technical deviation.
  const eligibleForRecommendation = !input.mandatoryDeviation && technicalCompliance >= 90;

  const total =
    technicalCompliance * supplierScoreWeights.technicalCompliance +
    landedCost * supplierScoreWeights.landedCost +
    credibility * supplierScoreWeights.credibility +
    leadTime * supplierScoreWeights.leadTime +
    commercialTerms * supplierScoreWeights.commercialTerms;

  return {
    ...input,
    technicalCompliance,
    landedCost,
    credibility,
    leadTime,
    commercialTerms,
    total: Number(total.toFixed(2)),
    eligibleForRecommendation,
  };
}
