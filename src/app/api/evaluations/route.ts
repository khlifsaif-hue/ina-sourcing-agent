import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { supplierEvaluations } from "@/db/schema";
import { isAuthorizedApiRequest } from "@/lib/api-auth";

const score = z
  .union([z.string().min(1), z.number().min(0).max(100)])
  .transform((value) => String(value));

const createEvaluationSchema = z.object({
  supplierId: z.string().uuid(),
  sourcingRequestId: z.string().uuid().optional(),
  technicalScore: score.optional(),
  priceScore: score.optional(),
  credibilityScore: score.optional(),
  leadTimeScore: score.optional(),
  commercialScore: score.optional(),
  totalScore: score.optional(),
  rationale: z.string().max(10000).optional(),
});

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      .from(supplierEvaluations)
      .where(eq(supplierEvaluations.sourcingRequestId, parsedId.data))
      .orderBy(desc(supplierEvaluations.createdAt));

    return NextResponse.json({ ok: true, evaluations: rows });
  }

  const rows = await db
    .select()
    .from(supplierEvaluations)
    .orderBy(desc(supplierEvaluations.createdAt))
    .limit(250);

  return NextResponse.json({ ok: true, evaluations: rows });
}

export async function POST(request: Request) {
  if (!isAuthorizedApiRequest(request)) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createEvaluationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [created] = await db
    .insert(supplierEvaluations)
    .values(parsed.data)
    .returning();

  return NextResponse.json({ ok: true, evaluation: created }, { status: 201 });
}
