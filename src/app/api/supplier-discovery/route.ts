import { NextResponse } from "next/server";
import { z } from "zod";
import { qualifyCandidate, type SupplierCandidate } from "@/modules/sourcing/discovery-agent";

const candidateSchema = z.object({
  legalName: z.string().min(2),
  country: z.string().optional(),
  website: z.string().url().optional(),
  sourceUrl: z.string().url(),
  sourceType: z.enum(["manufacturer-site", "marketplace", "directory", "search"]),
  claimedFactory: z.boolean().default(false),
  productEvidence: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
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
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const suppliers = parsed.data.candidates.map((candidate) => ({
    ...candidate,
    qualification: qualifyCandidate(candidate as SupplierCandidate),
  }));

  return NextResponse.json({
    suppliers,
    found: suppliers.length,
    qualified: suppliers.filter((supplier) => supplier.qualification.qualified).length,
    note: "Only source-backed prices are accepted. Missing prices must be obtained by RFQ; the agent must never invent a market price.",
  });
}
