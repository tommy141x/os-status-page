import { $ } from "bun";
import { loadConfig } from "../src/lib/server-utils";

let config = await loadConfig();

await Promise.all([
  $`bun --watch run src/backend.ts`,
  $`bunx --bun astro dev --port ${config.port}`,
]);
