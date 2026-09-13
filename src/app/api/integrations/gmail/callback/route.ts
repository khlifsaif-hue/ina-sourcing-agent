import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { auditLog, gmailCredentials, gmailOauthStates, senderProfiles } from "@/db/schema";
import { apiError } from "@/lib/api-errors";
import { decryptSecret, encryptSecret, exchangeCode, getGmailConfig, getGmailEmail, grantedScopes, hashValue } from "@/modules/communications/gmail-oauth";

export async function GET(request: Request) {
  const url = new URL(request.url); const code = url.searchParams.get("code"); const state = url.searchParams.get("state");
  if (!code || !state || url.searchParams.get("error")) return Response.json({ error: "Gmail authorization was cancelled or incomplete." }, { status: 400 });
  try {
    const config = getGmailConfig(); const db = getDb(); const [pending] = await db.select().from(gmailOauthStates).where(eq(gmailOauthStates.stateHash, hashValue(state))).limit(1);
    if (!pending || pending.consumedAt || pending.expiresAt <= new Date()) return Response.json({ error: "This Gmail authorization link has expired. Start again from settings." }, { status: 400 });
    await db.update(gmailOauthStates).set({ consumedAt: new Date() }).where(eq(gmailOauthStates.id, pending.id));
    const [profile] = await db.select().from(senderProfiles).where(eq(senderProfiles.id, pending.senderProfileId)).limit(1);
    if (!profile) return Response.json({ error: "The selected sender profile no longer exists." }, { status: 400 });
    const tokens = await exchangeCode(config, code, decryptSecret(pending.codeVerifierCiphertext, config.tokenKey));
    const gmailEmail = await getGmailEmail(tokens.access_token);
    if (gmailEmail !== profile.senderEmail.toLowerCase()) {
      await db.update(senderProfiles).set({ connectionStatus: "needs_reconnect", updatedAt: new Date() }).where(eq(senderProfiles.id, profile.id));
      return Response.json({ error: "Authorize the same Gmail address selected in the sender profile." }, { status: 400 });
    }
    const now = new Date(); const expiresAt = tokens.expires_in ? new Date(now.getTime() + tokens.expires_in * 1000) : null;
    await db.transaction(async (tx) => {
      await tx.insert(gmailCredentials).values({ senderProfileId: profile.id, gmailEmail, encryptedAccessToken: encryptSecret(tokens.access_token, config.tokenKey), encryptedRefreshToken: encryptSecret(tokens.refresh_token, config.tokenKey), tokenExpiresAt: expiresAt, grantedScopes: grantedScopes(tokens.scope), updatedAt: now }).onConflictDoUpdate({ target: gmailCredentials.senderProfileId, set: { gmailEmail, encryptedAccessToken: encryptSecret(tokens.access_token, config.tokenKey), encryptedRefreshToken: encryptSecret(tokens.refresh_token, config.tokenKey), tokenExpiresAt: expiresAt, grantedScopes: grantedScopes(tokens.scope), updatedAt: now } });
      await tx.update(senderProfiles).set({ connectionStatus: "connected", updatedAt: now }).where(eq(senderProfiles.id, profile.id));
      await tx.insert(auditLog).values({ actorType: "gmail", actorId: gmailEmail, action: "gmail-authorized", entityType: "sender_profile", entityId: profile.id, afterData: { gmailEmail } });
    });
    return Response.json({ connected: true, senderEmail: profile.senderEmail }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
