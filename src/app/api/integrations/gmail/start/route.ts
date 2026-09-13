import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { auditLog, gmailOauthStates, senderProfiles } from "@/db/schema";
import { checkApiAccess } from "@/lib/api-access";
import { apiError, readJsonBody } from "@/lib/api-errors";
import { createAuthorizationUrl, createCodeVerifier, createOAuthState, encryptSecret, getGmailConfig, hashValue } from "@/modules/communications/gmail-oauth";

const input = z.object({ senderProfileId: z.string().uuid() });
export async function POST(request: Request) {
  const denied = checkApiAccess(request); if (denied) return denied;
  try {
    const parsed = input.safeParse(await readJsonBody(request));
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    const config = getGmailConfig(); const db = getDb();
    const [profile] = await db.select().from(senderProfiles).where(eq(senderProfiles.id, parsed.data.senderProfileId)).limit(1);
    if (!profile || profile.provider !== "gmail" || profile.connectionStatus === "disabled") return Response.json({ error: "Select an enabled Gmail sender profile." }, { status: 400 });
    const state = createOAuthState(); const verifier = createCodeVerifier(); const now = new Date();
    await db.insert(gmailOauthStates).values({ senderProfileId: profile.id, stateHash: hashValue(state), codeVerifierCiphertext: encryptSecret(verifier, config.tokenKey), expiresAt: new Date(now.getTime() + 10 * 60 * 1000) });
    await db.insert(auditLog).values({ actorType: "platform", actorId: "gmail-oauth", action: "gmail-authorization-started", entityType: "sender_profile", entityId: profile.id, afterData: { senderEmail: profile.senderEmail } });
    return Response.json({ authorizationUrl: createAuthorizationUrl(config, state, verifier, profile.senderEmail), expiresAt: new Date(now.getTime() + 10 * 60 * 1000).toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
