export type SupplierCandidate = {
  legalName: string;
  country?: string;
  website?: string;
  sourceUrl: string;
  sourceType: "manufacturer-site" | "marketplace" | "directory" | "search";
  claimedFactory: boolean;
  productEvidence: string[];
  certifications: string[];
  contactEmail?: string;
  price?: {
    amount: number;
    currency: string;
    basis: string;
    moq?: number;
    incoterm?: string;
    sourceUrl: string;
  };
};

export type DiscoveryQuery = {
  product: string;
  specifications: Array<{ key: string; value: string; mandatory: boolean }>;
  quantity: number;
  destination: string;
  preferredCountries?: string[];
};

export type DiscoveryResult = {
  query: DiscoveryQuery;
  candidates: SupplierCandidate[];
  warnings: string[];
};

export interface SupplierSearchProvider {
  search(query: DiscoveryQuery): Promise<SupplierCandidate[]>;
}

function normalizedUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return `${url.hostname.replace(/^www\./, "")}${url.pathname}`.replace(/\/$/, "");
  } catch {
    return value.toLowerCase().trim();
  }
}

export function deduplicateSuppliers(candidates: SupplierCandidate[]) {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    // A marketplace domain can contain many unrelated factories. Keep its
    // supplier page in the key; independent websites use their hostname.
    let website = normalizedUrl(candidate.website);
    if (candidate.website) {
      try {
        const host = new URL(candidate.website).hostname.toLowerCase().replace(/^www\./, "");
        if (!/(^|\.)(alibaba\.com|1688\.com|made-in-china\.com|globalsources\.com)$/.test(host)) website = host;
      } catch { /* Preserve the existing normalized fallback. */ }
    }
    const key = website ?? `${candidate.legalName.toLowerCase().trim()}|${candidate.country?.toLowerCase().trim() ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function qualifyCandidate(candidate: SupplierCandidate) {
  const uniqueEvidenceCount = (items: string[]) => new Set(items.map((item) => item.trim().toLowerCase()).filter(Boolean)).size;
  let score = 0;
  if (candidate.claimedFactory) score += 25;
  if (candidate.website) score += 15;
  score += Math.min(25, uniqueEvidenceCount(candidate.productEvidence) * 5);
  score += Math.min(15, uniqueEvidenceCount(candidate.certifications) * 5);
  if (candidate.contactEmail) score += 10;
  if (candidate.price && Number.isFinite(candidate.price.amount) && candidate.price.amount > 0 && candidate.price.sourceUrl.trim()) score += 10;

  return {
    score,
    qualified: score >= 50,
    factoryStatus: candidate.claimedFactory ? "claimed-factory" : "unverified",
  } as const;
}

export async function runSupplierDiscovery(provider: SupplierSearchProvider, query: DiscoveryQuery): Promise<DiscoveryResult> {
  const raw = await provider.search(query);
  const candidates = deduplicateSuppliers(raw);

  return {
    query,
    candidates,
    warnings: candidates.length === 0 ? ["No suppliers discovered. Broaden search terms or add another search provider."] : [],
  };
}
