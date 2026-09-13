import { NextResponse } from "next/server";
import { z } from "zod";
import { checkApiAccess } from "@/lib/api-access";
import { apiError, readJsonBody } from "@/lib/api-errors";
import { deduplicateSuppliers, qualifyCandidate } from "@/modules/sourcing/discovery-agent";
import { parseSupplierSearchChannels, SerperSupplierSearchProvider } from "@/modules/sourcing/serper-provider";

const requestSchema = z.object({
  product: z.string().trim().min(3).max(240),
  quantity: z.number().int().positive().max(1_000_000),
  destination: z.string().trim().min(2).max(200).default("Doha, Qatar"),
  specifications: z.array(z.object({ key: z.string().trim().min(1).max(120), value: z.string().trim().min(1).max(500), mandatory: z.boolean().default(true) })).max(12).default([]),
  channels: z.array(z.enum(["alibaba", "made-in-china", "global-sources", "indiamart", "direct-factories", "web"])).max(6).optional(),
});

export async function POST(request: Request) {
  const denied = checkApiAccess(request);
  if (denied) return denied;
  try {
    const parsed = requestSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const provider = new SerperSupplierSearchProvider(undefined, fetch, parseSupplierSearchChannels(parsed.data.channels));
    const candidates = deduplicateSuppliers(await provider.search(parsed.data));
    const suppliers = candidates.map((candidate) => ({ ...candidate, qualification: qualifyCandidate(candidate) }));
    return NextResponse.json({
      mode: "bounded-web-discovery-preview",
      callsPlanned: Math.min(3, parseSupplierSearchChannels(parsed.data.channels).length),
      found: suppliers.length,
      suppliers,
      warning: "Search results are discovery leads, not verified factories or quotations. No supplier is contacted and no price is treated as comparable without review.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
