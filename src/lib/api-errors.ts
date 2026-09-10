export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new InvalidJsonError();
  }
}

class InvalidJsonError extends Error {}

export function apiError(error: unknown): Response {
  if (error instanceof InvalidJsonError) {
    return Response.json({ error: "Provide a valid JSON request body." }, { status: 400 });
  }
  // Do not expose SQL, connection URLs or provider credentials in responses.
  return Response.json({ error: "The operation could not be completed. Check server configuration." }, {
    status: 503,
    headers: { "Cache-Control": "no-store" },
  });
}
