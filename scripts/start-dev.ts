import { $ } from "bun";

await Promise.all([$`bun --watch run src/backend.ts`, $`bunx --bun astro dev`]);
