import { desc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { senderProfiles } from "@/db/schema";
import { checkApiAccess } from "@/lib/api-access";
import { apiError } from "@/lib/api-errors";
export async function GET(request: Request) {
  const denied = checkApiAccess(request); if (denied) return denied;
  try {
    const profiles = await getDb().select({ id: senderProfiles.id, senderEmail: senderProfiles.senderEmail, connectionStatus: senderProfiles.connectionStatus, isActive: senderProfiles.isActive, updatedAt: senderProfiles.updatedAt }).from(senderProfiles).orderBy(desc(senderProfiles.isActive), desc(senderProfiles.updatedAt));
    return Response.json({ profiles }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
