import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { getEnv } from "@/lib/env";

let client: ReturnType<typeof drizzle> | undefined;

export function getDb() {
  // Defer configuration until an authorized database operation is requested.
  // Building the app and serving liveness must not require database secrets.
  return client ??= drizzle(neon(getEnv().DATABASE_URL));
}
