export type OfferCompliance = "compliant" | "deviation" | "unknown";

export type SupplierOffer = {
  supplierId: string;
  quotationId?: string;
  currency: string;
  unitPrice?: number;
  quantity: number;
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
};

export function normalizeCurrencyCode(currency: string): string {
  const normalized = currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) throw new Error(`Invalid currency code: ${currency}`);
  return normalized;
}

export function isOfferEligibleForPriceComparison(offer: SupplierOffer): boolean {
  if (offer.unitPrice === undefined || offer.unitPrice < 0) return false;
  if (offer.mandatoryCompliance !== "compliant") return false;
  if (offer.engineeringDecisionRequired) return false;
  return true;
}

export function preparePriceComparison(offers: SupplierOffer[]): PriceComparisonEntry[] {
  return offers
    .filter(isOfferEligibleForPriceComparison)
    .map((offer) => ({
      ...offer,
      currency: normalizeCurrencyCode(offer.currency),
      extendedPrice: (offer.unitPrice ?? 0) * offer.quantity,
      authoritative: offer.sourceType === "quotation",
    }))
    .sort((a, b) => {
      if (a.currency !== b.currency) return Number(b.authoritative) - Number(a.authoritative);
      if (a.authoritative !== b.authoritative) return Number(b.authoritative) - Number(a.authoritative);
      return a.extendedPrice - b.extendedPrice;
    });
}

export function selectAuthoritativeOffer(published: SupplierOffer | undefined, quotation: SupplierOffer | undefined): SupplierOffer | undefined {
  return quotation ?? published;
}
