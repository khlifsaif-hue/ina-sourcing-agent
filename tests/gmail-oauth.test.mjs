import test from "node:test";
import assert from "node:assert/strict";
import { createAuthorizationUrl, createCodeChallenge, decryptSecret, encryptSecret, getGmailConfig, hashValue } from "../src/modules/communications/gmail-oauth.ts";

test("Gmail OAuth state helpers are deterministic where required and secrets are authenticated", () => {
  const key = Buffer.alloc(32, 7); const encrypted = encryptSecret("refresh-token", key);
  assert.equal(decryptSecret(encrypted, key), "refresh-token");
  assert.throws(() => decryptSecret(`${encrypted}changed`, key));
  assert.equal(createCodeChallenge("verifier"), hashValue("verifier"));
});
test("Gmail authorization URL uses server callback, offline refresh and PKCE", () => {
  const previous = { GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET, GMAIL_TOKEN_ENCRYPTION_KEY: process.env.GMAIL_TOKEN_ENCRYPTION_KEY, APP_URL: process.env.APP_URL };
  Object.assign(process.env, { GMAIL_CLIENT_ID: "client", GMAIL_CLIENT_SECRET: "secret", GMAIL_TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 4).toString("base64"), APP_URL: "https://agent.example" });
  try { const url = new URL(createAuthorizationUrl(getGmailConfig(), "state", "verifier", "saif@ibtechar.com")); assert.equal(url.searchParams.get("redirect_uri"), "https://agent.example/api/integrations/gmail/callback"); assert.equal(url.searchParams.get("access_type"), "offline"); assert.equal(url.searchParams.get("code_challenge_method"), "S256"); assert.equal(url.searchParams.get("login_hint"), "saif@ibtechar.com"); } finally { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } }
});
