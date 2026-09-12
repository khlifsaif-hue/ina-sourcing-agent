import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAuthorizedApiRequest(request: Request) {
  const configuredKey = env.DIFY_API_KEY;
  if (!configuredKey) return false;

  const authorization = request.headers.get("authorization");
  const apiKey = request.headers.get("x-api-key");
  const suppliedKey = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : apiKey;

  if (!suppliedKey) return false;
  return safeEqual(suppliedKey, configuredKey);
}
