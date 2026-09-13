export type LandedCostInput = {
  quantity: number;
  unitPrice: number;
  freight: number;
  duty: number;
  handling: number;
  other?: number;
};

export function calculateLandedCost(input: LandedCostInput) {
  if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0) {
    throw new Error("Quantity must be a positive whole number.");
  }
  if (![input.unitPrice, input.freight, input.duty, input.handling, input.other ?? 0]
    .every((amount) => Number.isFinite(amount) && amount >= 0)) {
    throw new Error("All landed-cost amounts must be finite, nonnegative and in the same currency.");
  }
  const goodsValue = input.quantity * input.unitPrice;
  const total = goodsValue + input.freight + input.duty + input.handling + (input.other ?? 0);
  if (!Number.isFinite(total)) throw new Error("Landed cost exceeds the supported range.");
  return {
    goodsValue,
    total,
    landedUnitCost: total / input.quantity,
  };
}
