import { $ } from "bun";
import { stat } from "node:fs/promises";
import { promises as fs } from "fs";
import path from "path";
import { loadConfig } from "../src/lib/server-utils";

let config = await loadConfig();

// Get config.port, and modify astro.config.mjs
const astroConfigPath = path.resolve(process.cwd(), "astro.config.mjs");

try {
  const astroConfigContent = await fs.readFile(astroConfigPath, "utf-8");
  const updatedConfigContent = astroConfigContent.replace(
    /server:\s*\{[^}]*\}/,
    `server: { host: true, port: ${config.port} }`,
  );

  if (updatedConfigContent !== astroConfigContent) {
    await fs.writeFile(astroConfigPath, updatedConfigContent);
    console.log(`Updating astro.config.mjs port to ${config.port}`);
    await $`bunx astro build`;
  } else {
    console.log(`astro.config.mjs port is already set to ${config.port}`);
  }
} catch (error) {
  console.error("Error updating astro.config.mjs:", error);
}

// Function to check if a directory exists
const directoryExists = async (dirPath) => {
  try {
    const parentDir = path.dirname(import.meta.url);
    const fullPath = path.join(parentDir, dirPath);
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
  $`bun run src/backend.ts`,
  $`bun run ./dist/server/entry.mjs`,
]);
