import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { suppliers } from "@/db/schema";
import { isAuthorizedApiRequest } from "@/lib/api-auth";

const createSupplierSchema = z.object({
  legalName: z.string().min(2),
  tradingName: z.string().min(1).optional(),
  country: z.string().min(2).optional(),
  website: z.string().url().optional(),
  supplierType: z.enum(["factory", "trader", "unknown"]).default("unknown"),
  verifiedFactory: z.boolean().default(false),
  certifications: z.array(z.string().min(1)).default([]),
  notes: z.string().max(10000).optional(),
});

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: Request) {
  if (!isAuthorizedApiRequest(request)) return unauthorized();

  const rows = await db
    .select()
    .from(suppliers)
    .orderBy(desc(suppliers.createdAt))
    .limit(250);

  return NextResponse.json({ ok: true, suppliers: rows });
}

export async function POST(request: Request) {
  if (!isAuthorizedApiRequest(request)) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createSupplierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [created] = await db.insert(suppliers).values(parsed.data).returning();
  return NextResponse.json({ ok: true, supplier: created }, { status: 201 });
}
