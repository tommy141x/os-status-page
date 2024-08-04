import { $ } from "bun";
import { stat } from "node:fs/promises";
import { join, dirname } from "node:path";

// Function to check if a directory exists
const directoryExists = async (dirPath) => {
  try {
    const parentDir = dirname(import.meta.dir);
    const fullPath = join(parentDir, dirPath);
    const stats = await stat(fullPath);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
};

const runBuildIfNeeded = async () => {
  const distExists = await directoryExists("dist");

  if (!distExists) {
    await $`bunx --bun astro build`;
  }
};

// Run build command if necessary and start the watchers
await runBuildIfNeeded();
await Promise.all([
  $`bun --watch run src/backend.ts`,
  $`bunx --bun astro preview`,
]);
