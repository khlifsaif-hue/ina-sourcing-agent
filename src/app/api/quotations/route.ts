import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { quotations } from "@/db/schema";
import { isAuthorizedApiRequest } from "@/lib/api-auth";

const money = z.union([z.string().min(1), z.number()]).transform((value) => String(value));

const createQuotationSchema = z.object({
  sourcingRequestId: z.string().uuid(),
  supplierId: z.string().uuid(),
  rfqId: z.string().uuid().optional(),
  supplierQuoteRef: z.string().max(250).optional(),
  currency: z.string().length(3).transform((value) => value.toUpperCase()).default("USD"),
  unitPrice: money.optional(),
  moq: z.number().int().positive().optional(),
  incoterm: z.string().max(20).optional(),
  leadTimeDays: z.number().int().nonnegative().optional(),
  samplePrice: money.optional(),
  paymentTerms: z.string().max(1000).optional(),
  validityDays: z.number().int().positive().optional(),
  rawOffer: z.unknown().optional(),
});

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: Request) {
  if (!isAuthorizedApiRequest(request)) return unauthorized();

  const url = new URL(request.url);
  const sourcingRequestId = url.searchParams.get("sourcingRequestId");

  let query = db.select().from(quotations);
  if (sourcingRequestId) {
    const parsedId = z.string().uuid().safeParse(sourcingRequestId);
    if (!parsedId.success) {
      return NextResponse.json({ error: "Invalid sourcingRequestId" }, { status: 400 });
    }
    const rows = await query
      .where(eq(quotations.sourcingRequestId, parsedId.data))
      .orderBy(desc(quotations.receivedAt));
    return NextResponse.json({ ok: true, quotations: rows });
  }

  const rows = await query.orderBy(desc(quotations.receivedAt)).limit(250);
  return NextResponse.json({ ok: true, quotations: rows });
}

export async function POST(request: Request) {
  if (!isAuthorizedApiRequest(request)) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createQuotationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [created] = await db.insert(quotations).values(parsed.data).returning();
  return NextResponse.json({ ok: true, quotation: created }, { status: 201 });
}
