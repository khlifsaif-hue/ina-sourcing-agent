export type SupplierScoreInput = {
  technical: number;
  price: number;
  credibility: number;
  leadTime: number;
  commercial: number;
};

const weights = {
  technical: 0.35,
  price: 0.25,
  credibility: 0.15,
  leadTime: 0.10,
  commercial: 0.15,
} as const;

export function calculateSupplierScore(input: SupplierScoreInput): number {
  const weighted =
    input.technical * weights.technical +
    input.price * weights.price +
    input.credibility * weights.credibility +
    input.leadTime * weights.leadTime +
    input.commercial * weights.commercial;

  return Math.round(weighted * 100) / 100;
}
