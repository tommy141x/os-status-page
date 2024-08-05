import type { APIRoute } from "astro";
import { Database } from "bun:sqlite";
import { loadConfig } from "@/lib/server-utils";
import { writeFile, readFile } from "fs/promises";
import * as yaml from "js-yaml";

const db = new Database("statusdb.sqlite");
let config = await loadConfig();

export const GET: APIRoute = async () => {
  try {
    // Read the current YAML configuration from the file
    const yamlData = await readFile("@/../config.yml", "utf8");

    // Respond with the YAML data
    return new Response(yamlData, {
      status: 200,
      headers: { "Content-Type": "application/x-yaml" },
    });
  } catch (e) {
    console.error(e);
    return new Response("Failed to read config file", { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    // Get the raw request body as text
    const rawBody = await request.text();

    // Parse the YAML data
    let data;
    try {
      data = yaml.load(rawBody);
    } catch (e) {
      return new Response("Invalid YAML", { status: 400 });
    }

    // Write YAML data to the config file
    try {
      await writeFile("./config.yml", rawBody);
    } catch (e) {
      return new Response("Failed to write config file", { status: 500 });
    }

    return new Response("Config updated successfully", { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response("Internal Server Error", { status: 500 });
  }
};
