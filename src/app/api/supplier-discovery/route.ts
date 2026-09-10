import { NextResponse } from "next/server";
import { z } from "zod";
import { deduplicateSuppliers, qualifyCandidate, type SupplierCandidate } from "@/modules/sourcing/discovery-agent";
import { checkApiAccess } from "@/lib/api-access";
import { apiError, readJsonBody } from "@/lib/api-errors";

const candidateSchema = z.object({
  legalName: z.string().trim().min(2).max(240),
  country: z.string().optional(),
  website: z.string().url().optional(),
  sourceUrl: z.string().url(),
  sourceType: z.enum(["manufacturer-site", "marketplace", "directory", "search"]),
  claimedFactory: z.boolean().default(false),
  productEvidence: z.array(z.string().trim().min(1).max(2000)).max(25).default([]),
  certifications: z.array(z.string().trim().min(1).max(500)).max(25).default([]),
  contactEmail: z.string().email().optional(),
  price: z.object({
    amount: z.number().nonnegative(),
    currency: z.string().length(3),
    basis: z.string().min(1),
    moq: z.number().int().positive().optional(),
    incoterm: z.string().optional(),
    sourceUrl: z.string().url(),
  }).optional(),
});

const requestSchema = z.object({
  candidates: z.array(candidateSchema).max(100),
});

export async function POST(request: Request) {
  const denied = checkApiAccess(request);
  if (denied) return denied;
  try {
    const parsed = requestSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const suppliers = deduplicateSuppliers(parsed.data.candidates).map((candidate) => ({
      ...candidate,
      qualification: qualifyCandidate(candidate as SupplierCandidate),
    }));

    return NextResponse.json({
      mode: "candidate-qualification",
      suppliers,
      found: suppliers.length,
      qualified: suppliers.filter((supplier) => supplier.qualification.qualified).length,
      note: "This endpoint qualifies supplied candidates; it does not search the web or verify source claims. Published prices need technical and commercial review before comparison.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
