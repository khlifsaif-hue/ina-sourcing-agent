import type { DiscoveryQuery, SupplierCandidate, SupplierSearchProvider } from "@/modules/sourcing/discovery-agent";

type FetchLike = typeof fetch;

type SerperOrganicResult = {
  title?: string;
  link?: string;
  snippet?: string;
};

type SerperResponse = {
  organic?: SerperOrganicResult[];
};

export type SupplierSearchChannel = "alibaba" | "made-in-china" | "global-sources" | "indiamart" | "direct-factories" | "web";

const channelQuery: Record<SupplierSearchChannel, string> = {
  alibaba: "site:alibaba.com",
  "made-in-china": "site:made-in-china.com",
  "global-sources": "site:globalsources.com",
  indiamart: "site:indiamart.com",
  "direct-factories": "manufacturer factory official website",
  web: "manufacturer supplier",
};

const marketplaceHosts = /(^|\.)(alibaba\.com|made-in-china\.com|globalsources\.com|indiamart\.com)$/i;
const manufacturerSignals = /\b(factory|manufacturer|manufacturing|oem|odm)\b/i;

function buildSearchText(query: DiscoveryQuery) {
  const mandatory = query.specifications
    .filter((specification) => specification.mandatory)
    .slice(0, 3)
    .map((specification) => `${specification.key} ${specification.value}`)
    .join(" ");
  return [query.product, mandatory, query.quantity ? `${query.quantity} supplier` : "supplier"].filter(Boolean).join(" ");
}

function candidateFromResult(result: SerperOrganicResult): SupplierCandidate | null {
  if (!result.link || !result.title) return null;
  let host = "";
  try {
    host = new URL(result.link).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }

  const evidence = [result.title, result.snippet].filter((item): item is string => Boolean(item?.trim()));
  const isMarketplace = marketplaceHosts.test(host);
  const claimedFactory = !isMarketplace && manufacturerSignals.test(`${result.title} ${result.snippet ?? ""}`);

  return {
    legalName: result.title.trim().slice(0, 240),
    website: `https://${host}`,
    sourceUrl: result.link,
    sourceType: isMarketplace ? "marketplace" : "search",
    claimedFactory,
    productEvidence: evidence,
    certifications: [],
  };
}

export class SerperSupplierSearchProvider implements SupplierSearchProvider {
  private readonly apiKey: string | undefined;
  private readonly fetcher: FetchLike;
  private readonly channels: SupplierSearchChannel[];

  constructor(
    apiKey: string | undefined = process.env.SUPPLIER_SEARCH_API_KEY,
    fetcher: FetchLike = fetch,
    channels: SupplierSearchChannel[] = ["alibaba", "made-in-china", "global-sources", "indiamart", "direct-factories", "web"],
  ) {
    this.apiKey = apiKey;
    this.fetcher = fetcher;
    this.channels = channels;
  }

  async search(query: DiscoveryQuery): Promise<SupplierCandidate[]> {
    if (!this.apiKey?.trim()) throw new Error("Supplier search provider is not configured.");
    const apiKey = this.apiKey;

    const channels = [...new Set(this.channels)].slice(0, 3);
    const searchText = buildSearchText(query);
    const responses = await Promise.all(channels.map(async (channel) => {
      const response = await this.fetcher("https://google.serper.dev/search", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
        body: JSON.stringify({ q: `${searchText} ${channelQuery[channel]}`, num: 8 }),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Supplier search provider returned ${response.status}.`);
      return response.json() as Promise<SerperResponse>;
    }));

    return responses
      .flatMap((response) => response.organic ?? [])
      .map(candidateFromResult)
      .filter((candidate): candidate is SupplierCandidate => candidate !== null);
  }
}

export function parseSupplierSearchChannels(value: readonly string[] | undefined): SupplierSearchChannel[] {
  const allowed = new Set<SupplierSearchChannel>(["alibaba", "made-in-china", "global-sources", "indiamart", "direct-factories", "web"]);
  const selected = (value ?? []).filter((channel): channel is SupplierSearchChannel => allowed.has(channel as SupplierSearchChannel));
  return selected.length ? [...new Set(selected)].slice(0, 3) : ["alibaba", "made-in-china", "direct-factories"];
}
