import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { rfqs } from "@/db/schema";
import { isAuthorizedApiRequest } from "@/lib/api-auth";

const createRfqSchema = z.object({
  sourcingRequestId: z.string().uuid(),
  reference: z.string().min(3).max(120).optional(),
  incotermRequested: z.string().min(2).max(20).default("FOB"),
  paymentTermsRequested: z.string().max(1000).optional(),
  sampleRequested: z.boolean().default(true),
});

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function generateReference() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = randomUUID().slice(0, 8).toUpperCase();
  return `INA-RFQ-${date}-${suffix}`;
}

export async function GET(request: Request) {
  if (!isAuthorizedApiRequest(request)) return unauthorized();

  const url = new URL(request.url);
  const sourcingRequestId = url.searchParams.get("sourcingRequestId");

  if (sourcingRequestId) {
    const parsedId = z.string().uuid().safeParse(sourcingRequestId);
    if (!parsedId.success) {
      return NextResponse.json({ error: "Invalid sourcingRequestId" }, { status: 400 });
    }

    const rows = await db
      .select()
      .from(rfqs)
      .where(eq(rfqs.sourcingRequestId, parsedId.data))
      .orderBy(desc(rfqs.createdAt));

    return NextResponse.json({ ok: true, rfqs: rows });
  }

  const rows = await db.select().from(rfqs).orderBy(desc(rfqs.createdAt)).limit(250);
  return NextResponse.json({ ok: true, rfqs: rows });
}

export async function POST(request: Request) {
  if (!isAuthorizedApiRequest(request)) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createRfqSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const values = {
    ...parsed.data,
    reference: parsed.data.reference ?? generateReference(),
  };

  const [created] = await db.insert(rfqs).values(values).returning();
  return NextResponse.json({ ok: true, rfq: created }, { status: 201 });
}
