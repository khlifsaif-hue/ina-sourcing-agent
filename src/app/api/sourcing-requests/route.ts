import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { sourcingRequests } from "@/db/schema";
import { isAuthorizedApiRequest } from "@/lib/api-auth";

const createRequestSchema = z.object({
  title: z.string().min(3),
  targetQuantity: z.number().int().positive(),
  recurring: z.boolean().default(false),
  destinationCountry: z.string().default("Qatar"),
  destinationCity: z.string().default("Doha"),
  currency: z.string().length(3).default("USD"),
  notes: z.string().max(10000).optional(),
});

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: Request) {
  if (!isAuthorizedApiRequest(request)) return unauthorized();

  const rows = await db
    .select()
    .from(sourcingRequests)
    .orderBy(desc(sourcingRequests.createdAt))
    .limit(100);

  return NextResponse.json({ ok: true, requests: rows });
}

export async function POST(request: Request) {
  if (!isAuthorizedApiRequest(request)) return unauthorized();

  const body = await request.json();
  const parsed = createRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [created] = await db
    .insert(sourcingRequests)
    .values(parsed.data)
    .returning();

  return NextResponse.json({ ok: true, request: created }, { status: 201 });
}
