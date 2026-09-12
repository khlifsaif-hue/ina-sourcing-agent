import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { productSpecifications } from "@/db/schema";
import { isAuthorizedApiRequest } from "@/lib/api-auth";

const createSpecificationSchema = z.object({
  sourcingRequestId: z.string().uuid(),
  key: z.string().min(1),
  requiredValue: z.string().min(1),
  mandatory: z.boolean().default(true),
  notes: z.string().max(5000).optional(),
});

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: Request) {
  if (!isAuthorizedApiRequest(request)) return unauthorized();

  const url = new URL(request.url);
  const sourcingRequestId = url.searchParams.get("sourcingRequestId");

  if (!sourcingRequestId || !z.string().uuid().safeParse(sourcingRequestId).success) {
    return NextResponse.json(
      { error: "Valid sourcingRequestId query parameter is required" },
      { status: 400 },
    );
  }

  const rows = await db
    .select()
    .from(productSpecifications)
    .where(eq(productSpecifications.sourcingRequestId, sourcingRequestId));

  return NextResponse.json({ ok: true, specifications: rows });
}

export async function POST(request: Request) {
  if (!isAuthorizedApiRequest(request)) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createSpecificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [created] = await db
    .insert(productSpecifications)
    .values(parsed.data)
    .returning();

  return NextResponse.json({ ok: true, specification: created }, { status: 201 });
}
