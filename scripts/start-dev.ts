import { $ } from "bun";

await Promise.all([$`bun run src/backend.ts`, $`bunx --bun astro dev`]);
