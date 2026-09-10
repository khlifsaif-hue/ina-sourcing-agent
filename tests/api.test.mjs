import test from "node:test";
import assert from "node:assert/strict";
import { checkApiAccess } from "../src/lib/api-access.ts";
import { GET as listRequests, POST as createRequest } from "../src/app/api/sourcing-requests/route.ts";
import { POST as qualifyCandidates } from "../src/app/api/supplier-discovery/route.ts";

const token = "test-only-credential-012345678901234567890";
const request = (path, body, authorized = true) => new Request(`https://agent.example/api/${path}`, {
  method: "POST", headers: { "Content-Type": "application/json", ...(authorized ? { authorization: `Bearer ${token}` } : {}) }, body,
});

test("API access rejects missing configuration, wrong credentials, and missing credentials", () => {
  const r = new Request("https://agent.example/api/sourcing-requests");
  assert.equal(checkApiAccess(r, "").status, 503);
  assert.equal(checkApiAccess(r, "short").status, 503);
  assert.equal(checkApiAccess(r, token).status, 401);
  assert.equal(checkApiAccess(request("test", "{}"), token), null);
  assert.equal(checkApiAccess(request("test", "{}"), `${token}wrong`).status, 401);
});

test("data APIs authenticate before database configuration is evaluated", async () => {
  const previousToken = process.env.SOURCING_API_TOKEN;
  const previousDb = process.env.DATABASE_URL;
  process.env.SOURCING_API_TOKEN = token;
  delete process.env.DATABASE_URL;
  try {
    assert.equal((await listRequests(new Request("https://agent.example/api/sourcing-requests"))).status, 401);
    assert.equal((await createRequest(request("sourcing-requests", "{}", false))).status, 401);
    assert.equal((await qualifyCandidates(request("supplier-discovery", "{}", false))).status, 401);
  } finally {
    if (previousToken === undefined) delete process.env.SOURCING_API_TOKEN; else process.env.SOURCING_API_TOKEN = previousToken;
    if (previousDb === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = previousDb;
  }
});

test("malformed JSON returns 400 and the existing discovery route honestly qualifies supplied candidates", async () => {
  const previous = process.env.SOURCING_API_TOKEN;
  process.env.SOURCING_API_TOKEN = token;
  try {
    assert.equal((await createRequest(request("sourcing-requests", "{"))).status, 400);
    assert.equal((await qualifyCandidates(request("supplier-discovery", "{"))).status, 400);
    assert.equal((await createRequest(request("sourcing-requests", JSON.stringify({ title: "   ", targetQuantity: 1 })))).status, 400);
    const candidate = { legalName: "Example supplier", sourceUrl: "https://example.com", sourceType: "manufacturer-site", website: "https://example.com", claimedFactory: true, contactEmail: "sales@example.com" };
    const response = await qualifyCandidates(request("supplier-discovery", JSON.stringify({ candidates: [candidate, candidate] })));
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.mode, "candidate-qualification");
    assert.equal(data.found, 1);
  } finally {
    if (previous === undefined) delete process.env.SOURCING_API_TOKEN; else process.env.SOURCING_API_TOKEN = previous;
  }
});
