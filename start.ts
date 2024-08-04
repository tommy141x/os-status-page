import { $ } from "bun";
import { readdir } from "node:fs/promises";
import { join, dirname } from "node:path";

// Function to check if a directory exists
const directoryExists = async (dirPath) => {
  try {
    const parentDir = dirname(import.meta.dir); // Get the parent directory
    console.log(`Parent directory: ${parentDir}`); // Debugging line
    const files = await readdir(parentDir);
    console.log(`Files in parent directory: ${files.join(", ")}`); // Debugging line
    return files.includes(dirPath);
  } catch (error) {
    console.error(`Error reading directory: ${error.message}`); // Debugging line
    return false;
  }
};

const runBuildIfNeeded = async () => {
  const distExists = await directoryExists("dist");

  if (!distExists) {
    await $`echo "Directory 'dist' does not exist in the parent directory"`;
    //await $`bunx --bun astro build`;
  } else {
    await $`echo "Directory 'dist' exists in the parent directory"`;
  }
};

// Run build command if necessary and start the watchers
await runBuildIfNeeded();
//await Promise.all([$`bun run src/backend.ts`, $`bunx --bun astro preview`]);
