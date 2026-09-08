import { NextResponse } from "next/server";
import { z } from "zod";

const createRequestSchema = z.object({
  title: z.string().min(3),
  targetQuantity: z.number().int().positive(),
  recurring: z.boolean().default(false),
  destinationCountry: z.string().default("Qatar"),
  destinationCity: z.string().default("Doha"),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // DB persistence is intentionally added after DATABASE_URL is configured.
  return NextResponse.json({
    ok: true,
    request: parsed.data,
    status: "draft",
    next: "persist-to-neon",
  }, { status: 201 });
}
