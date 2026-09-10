import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { checkApiAccess } from "@/lib/api-access";
import { apiError, readJsonBody } from "@/lib/api-errors";
import { sourcingRequests } from "@/db/schema";

const createRequestSchema = z.object({
  title: z.string().trim().min(3).max(240),
  targetQuantity: z.number().int().positive(),
  recurring: z.boolean().default(false),
  destinationCountry: z.string().trim().min(2).max(100).default("Qatar"),
  destinationCity: z.string().trim().min(2).max(100).default("Doha"),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/).default("USD"),
  notes: z.string().max(4000).optional(),
});

export async function GET(request: Request) {
  const denied = checkApiAccess(request);
  if (denied) return denied;
  try {
    const rows = await getDb().select().from(sourcingRequests).orderBy(desc(sourcingRequests.createdAt)).limit(50);
    return NextResponse.json({ requests: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  const denied = checkApiAccess(request);
  if (denied) return denied;
  try {
    const parsed = createRequestSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const [created] = await getDb().insert(sourcingRequests).values({ ...parsed.data, status: "draft" }).returning();
    return NextResponse.json({ ok: true, request: created }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}
