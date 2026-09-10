import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { checkApiAccess } from "@/lib/api-access";
import { getReadiness } from "@/modules/sourcing/readiness";

export async function GET(request: Request) {
  const denied = checkApiAccess(request);
  if (denied) return denied;
  let database: "ready" | "unavailable" = "unavailable";
  try {
    await getDb().execute(sql`select 1`);
    database = "ready";
  } catch { /* Credentials and database errors must stay private. */ }
  const report = getReadiness(database);
  return Response.json(report, { status: report.ready ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
