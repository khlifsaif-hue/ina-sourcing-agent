export type OfferCompliance = "compliant" | "deviation" | "unknown";

export type SupplierOffer = {
  supplierId: string;
  quotationId?: string;
  currency: string;
  unitPrice?: number;
  quantity: number;
  unit?: string;
  moq?: number;
  incoterm?: string;
  leadTimeDays?: number;
  sourceType: "published" | "quotation";
  sourceReference: string;
  mandatoryCompliance: OfferCompliance;
  engineeringDecisionRequired?: boolean;
};

export type PriceComparisonEntry = SupplierOffer & {
  extendedPrice: number;
  authoritative: boolean;
  comparisonGroup: string;
};

export function normalizeCurrencyCode(currency: string): string {
  const normalized = currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) throw new Error(`Invalid currency code: ${currency}`);
  return normalized;
}

export function isOfferEligibleForPriceComparison(offer: SupplierOffer): boolean {
  if (offer.unitPrice === undefined || !Number.isFinite(offer.unitPrice) || offer.unitPrice <= 0) return false;
  if (!Number.isSafeInteger(offer.quantity) || offer.quantity <= 0) return false;
  if (!Number.isFinite(offer.unitPrice * offer.quantity)) return false;
  if (offer.moq !== undefined && (!Number.isSafeInteger(offer.moq) || offer.moq <= 0 || offer.quantity < offer.moq)) return false;
  if (!offer.supplierId.trim() || !offer.sourceReference.trim() || !offer.unit?.trim() || !offer.incoterm?.trim()) return false;
  if (!/^[A-Z]{3}$/.test(offer.currency.trim().toUpperCase())) return false;
  if (offer.mandatoryCompliance !== "compliant") return false;
  if (offer.engineeringDecisionRequired) return false;
  return true;
}

export function preparePriceComparison(offers: SupplierOffer[]): PriceComparisonEntry[] {
  // Call with offers for one requirement. Sort only within identical purchasing
  // bases; this list is not a cross-currency or cross-Incoterm recommendation.
  return offers
    .filter(isOfferEligibleForPriceComparison)
    .map((offer) => ({
      ...offer,
      currency: normalizeCurrencyCode(offer.currency),
      extendedPrice: (offer.unitPrice ?? 0) * offer.quantity,
      authoritative: offer.sourceType === "quotation",
      comparisonGroup: JSON.stringify([
        normalizeCurrencyCode(offer.currency),
        offer.unit!.trim().toLowerCase(),
        offer.incoterm!.trim().toUpperCase(),
        offer.quantity,
      ]),
    }))
    .sort((a, b) => {
      if (a.comparisonGroup !== b.comparisonGroup) return a.comparisonGroup.localeCompare(b.comparisonGroup);
      if (a.authoritative !== b.authoritative) return Number(b.authoritative) - Number(a.authoritative);
      return a.extendedPrice - b.extendedPrice;
    });
}

export function selectAuthoritativeOffer(published: SupplierOffer | undefined, quotation: SupplierOffer | undefined): SupplierOffer | undefined {
  return quotation ?? published;
}
