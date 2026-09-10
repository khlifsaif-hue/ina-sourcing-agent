import { createHash, timingSafeEqual } from "node:crypto";

// Single-owner service access only. Browser sign-in must use a verified session;
// this token must never be embedded in frontend code or a NEXT_PUBLIC variable.
export function checkApiAccess(request: Request, token = process.env.SOURCING_API_TOKEN): Response | null {
  if (!token || token.trim() !== token || token.length < 32) {
    return Response.json({ error: "API access is not configured." }, {
      status: 503, headers: { "Cache-Control": "no-store" },
    });
  }
  const match = /^Bearer ([^\s]+)$/.exec(request.headers.get("authorization") ?? "");
  const digest = (value: string) => createHash("sha256").update(value).digest();
  if (!match || !timingSafeEqual(digest(match[1]), digest(token))) {
    return Response.json({ error: "Authentication required." }, {
      status: 401,
      headers: { "WWW-Authenticate": "Bearer", "Cache-Control": "no-store" },
    });
  }
  return null;
}
