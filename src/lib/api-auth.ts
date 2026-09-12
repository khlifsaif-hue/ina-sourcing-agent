import { env } from "@/lib/env";

export function isAuthorizedApiRequest(request: Request) {
  const authorization = request.headers.get("authorization");
  const apiKey = request.headers.get("x-api-key");

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice(7) === env.DIFY_API_KEY;
  }

  return apiKey === env.DIFY_API_KEY;
}
