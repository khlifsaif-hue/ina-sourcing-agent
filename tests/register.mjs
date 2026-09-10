import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

// Native Node TypeScript keeps tests dependency-free. Production resolution
// remains owned by Next.js; this hook is used only by the test command.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return nextResolve(new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href, context);
    }
    if (specifier === "next/server") return nextResolve("next/server.js", context);
    if (specifier.startsWith(".") && context.parentURL?.endsWith(".ts")) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return nextResolve(pathToFileURL(fileURLToPath(candidate)).href, context);
    }
    return nextResolve(specifier, context);
  },
});
