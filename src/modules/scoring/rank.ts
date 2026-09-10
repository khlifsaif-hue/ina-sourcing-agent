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

const clamp = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;

export function rankSupplier(input: SupplierScoreInput): SupplierScore {
  const technicalCompliance = clamp(input.technicalCompliance);
  const landedCost = clamp(input.landedCost);
  const credibility = clamp(input.credibility);
  const leadTime = clamp(input.leadTime);
  const commercialTerms = clamp(input.commercialTerms);

  // Technical compliance is a gate, not merely a price-weighting factor.
  const validScores = [input.technicalCompliance, input.landedCost, input.credibility, input.leadTime, input.commercialTerms]
    .every((score) => Number.isFinite(score) && score >= 0 && score <= 100);
  const eligibleForRecommendation = input.mandatoryDeviation === false && technicalCompliance >= 90 && validScores;
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
