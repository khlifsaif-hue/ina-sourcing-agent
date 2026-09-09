import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { sourcingRequests } from "@/db/schema";

const createRequestSchema = z.object({
  title: z.string().min(3).max(240),
  targetQuantity: z.number().int().positive(),
  recurring: z.boolean().default(false),
  destinationCountry: z.string().min(2).default("Qatar"),
  destinationCity: z.string().min(2).default("Doha"),
  currency: z.string().length(3).default("USD"),
  notes: z.string().max(4000).optional(),
});

export async function GET() {
  const rows = await db.select().from(sourcingRequests).orderBy(desc(sourcingRequests.createdAt)).limit(50);
  return NextResponse.json({ requests: rows });
}

export async function POST(request: Request) {
  const parsed = createRequestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [created] = await db.insert(sourcingRequests).values({ ...parsed.data, status: "draft" }).returning();
  return NextResponse.json({ ok: true, request: created }, { status: 201 });
}
