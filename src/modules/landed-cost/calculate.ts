export type LandedCostInput = {
  quantity: number;
  unitPrice: number;
  freight: number;
  duty: number;
  handling: number;
  other?: number;
};

export function calculateLandedCost(input: LandedCostInput) {
  const goodsValue = input.quantity * input.unitPrice;
  const total = goodsValue + input.freight + input.duty + input.handling + (input.other ?? 0);
  return {
    goodsValue,
    total,
    landedUnitCost: input.quantity > 0 ? total / input.quantity : 0,
  };
}
