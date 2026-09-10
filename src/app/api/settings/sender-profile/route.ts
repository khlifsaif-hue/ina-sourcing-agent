import { desc, eq } from "drizzle-orm";
import { checkApiAccess } from "@/lib/api-access";
import { apiError, readJsonBody } from "@/lib/api-errors";
import { getDb } from "@/db/client";
import { auditLog, senderProfiles } from "@/db/schema";
import { senderProfileInput } from "@/modules/communications/sender-profile";

function publicProfile(profile: typeof senderProfiles.$inferSelect) {
  return {
    id: profile.id,
    senderName: profile.senderName,
    senderEmail: profile.senderEmail,
    companyName: profile.companyName,
    senderTitle: profile.senderTitle,
    replyTo: profile.replyTo,
    provider: profile.provider,
    connectionStatus: profile.connectionStatus,
    isActive: profile.isActive,
    updatedAt: profile.updatedAt,
  };
}

export async function GET(request: Request) {
  const denied = checkApiAccess(request);
  if (denied) return denied;
  try {
    const profiles = await getDb().select().from(senderProfiles)
      .orderBy(desc(senderProfiles.isActive), desc(senderProfiles.updatedAt));
    const active = profiles.find((profile) => profile.isActive) ?? null;
    return Response.json({ activeProfile: active ? publicProfile(active) : null, profiles: profiles.map(publicProfile) }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  const denied = checkApiAccess(request);
  if (denied) return denied;
  try {
    const parsed = senderProfileInput.safeParse(await readJsonBody(request));
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

    const db = getDb();
    const now = new Date();
    const profile = await db.transaction(async (tx) => {
      await tx.update(senderProfiles).set({ isActive: false, updatedAt: now }).where(eq(senderProfiles.isActive, true));
      const existing = await tx.select().from(senderProfiles).where(eq(senderProfiles.senderEmail, parsed.data.senderEmail)).limit(1);
      const values = { ...parsed.data, replyTo: parsed.data.replyTo || null, isActive: true, updatedAt: now };
      const [saved] = existing.length
        ? await tx.update(senderProfiles).set(values).where(eq(senderProfiles.id, existing[0].id)).returning()
        : await tx.insert(senderProfiles).values(values).returning();
      await tx.insert(auditLog).values({ actorType: "platform", actorId: "sender-profile", action: "sender-profile-updated", entityType: "sender_profile", entityId: saved.id, afterData: { senderEmail: saved.senderEmail, isActive: true } });
      return saved;
    });
    return Response.json({ profile: publicProfile(profile), nextStep: "Connect this Gmail account through the platform OAuth flow before sending or receiving." }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiError(error);
  }
}
