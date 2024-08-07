import type { APIRoute } from "astro";
import { Database } from "bun:sqlite";
import { loadConfig } from "@/lib/server-utils";

const db = new Database("statusdb.sqlite");

// Helper function to get incidents
async function getIncidents() {
  const stmt = db.prepare("SELECT * FROM incidents");
  return stmt.all();
}

// Helper function to create or update an incident
async function createOrUpdateIncident(incident: any) {
  const { id, description, type, services, timestamp, resolved_timestamp } =
    incident;

  if (id) {
    // Update existing incident
    const updateStmt = db.prepare(`
      UPDATE incidents
      SET description = ?, type = ?, services = ?, timestamp = ?, resolved_timestamp = ?
      WHERE id = ?
    `);
    updateStmt.run(
      description,
      type,
      services,
      timestamp,
      resolved_timestamp,
      id,
    );
  } else {
    // Create new incident
    const insertStmt = db.prepare(`
      INSERT INTO incidents (description, type, services, timestamp, resolved_timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertStmt.run(description, type, services, timestamp, resolved_timestamp);
  }
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const incidents = await getIncidents();
    return new Response(JSON.stringify(incidents), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to retrieve incidents" }),
      { status: 500 },
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const incident = await request.json();
    await createOrUpdateIncident(incident);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to create or update incident" }),
      { status: 500 },
    );
  }
};
