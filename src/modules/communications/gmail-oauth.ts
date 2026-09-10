import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { z } from "zod";

const gmailScopes = ["https://www.googleapis.com/auth/gmail.modify", "https://www.googleapis.com/auth/userinfo.email"];
const tokenSchema = z.object({
  access_token: z.string().min(1), refresh_token: z.string().min(1), expires_in: z.number().positive().optional(), scope: z.string().optional(), token_type: z.string().optional(),
});

export type GmailConfig = { clientId: string; clientSecret: string; tokenKey: Buffer; appUrl: URL };

export function getGmailConfig(): GmailConfig {
  const clientId = z.string().min(1).parse(process.env.GMAIL_CLIENT_ID);
  const clientSecret = z.string().min(1).parse(process.env.GMAIL_CLIENT_SECRET);
  const encodedKey = z.string().min(1).parse(process.env.GMAIL_TOKEN_ENCRYPTION_KEY);
  const tokenKey = Buffer.from(encodedKey, "base64");
  if (tokenKey.length !== 32) throw new Error("GMAIL_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  const appUrl = new URL(z.string().url().parse(process.env.APP_URL));
  if (appUrl.protocol !== "https:" && appUrl.hostname !== "localhost") throw new Error("APP_URL must use HTTPS outside localhost.");
  return { clientId, clientSecret, tokenKey, appUrl };
}

export function callbackUrl(config: GmailConfig) { return new URL("/api/integrations/gmail/callback", config.appUrl).toString(); }
export function createOAuthState() { return randomBytes(32).toString("base64url"); }
export function createCodeVerifier() { return randomBytes(48).toString("base64url"); }
export function hashValue(value: string) { return createHash("sha256").update(value).digest("base64url"); }
export function createCodeChallenge(verifier: string) { return hashValue(verifier); }

export function encryptSecret(value: string, key: Buffer) {
  const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${ciphertext.toString("base64url")}`;
}
export function decryptSecret(payload: string, key: Buffer) {
  const [version, ivText, tagText, ciphertextText] = payload.split(".");
  if (version !== "v1" || !ivText || !tagText || !ciphertextText) throw new Error("Invalid encrypted credential.");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextText, "base64url")), decipher.final()]).toString("utf8");
}

export function createAuthorizationUrl(config: GmailConfig, state: string, verifier: string, loginHint: string) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({ client_id: config.clientId, redirect_uri: callbackUrl(config), response_type: "code", scope: gmailScopes.join(" "), access_type: "offline", prompt: "consent", include_granted_scopes: "true", state, code_challenge: createCodeChallenge(verifier), code_challenge_method: "S256", login_hint: loginHint }).toString();
  return url.toString();
}

export async function exchangeCode(config: GmailConfig, code: string, verifier: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: callbackUrl(config), grant_type: "authorization_code", code_verifier: verifier }) });
  if (!response.ok) throw new Error("Google rejected the authorization code.");
  return tokenSchema.parse(await response.json());
}

export async function getGmailEmail(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error("Google account identity could not be verified.");
  return z.object({ email: z.string().email(), verified_email: z.boolean().optional() }).parse(await response.json()).email.toLowerCase();
}

export function grantedScopes(scope: string | undefined) { return (scope ?? "").split(/\s+/).filter(Boolean); }
