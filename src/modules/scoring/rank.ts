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

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function rankSupplier(input: SupplierScoreInput): SupplierScore {
  const technicalCompliance = clamp(input.technicalCompliance);
  const landedCost = clamp(input.landedCost);
  const credibility = clamp(input.credibility);
  const leadTime = clamp(input.leadTime);
  const commercialTerms = clamp(input.commercialTerms);

  // Technical compliance is a gate, not merely a price-weighting factor.
  const eligibleForRecommendation = !input.mandatoryDeviation && technicalCompliance >= 90;
  const total =
    technicalCompliance * 0.35 +
    landedCost * 0.3 +
    credibility * 0.15 +
    leadTime * 0.1 +
    commercialTerms * 0.1;

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
