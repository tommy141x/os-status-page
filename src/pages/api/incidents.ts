import type { APIRoute } from "astro";
import { Database } from "bun:sqlite";
import { sendMail } from "@/lib/mail";
import { loadConfig } from "@/lib/server-utils";

const db = new Database("statusdb.sqlite");
let config = await loadConfig();

// Helper function to get incidents
async function getIncidents() {
  const stmt = db.prepare("SELECT * FROM incidents");
  return stmt.all();
}

// Helper function to create or update an incident
async function createOrUpdateIncident(incident: any) {
  const {
    id,
    title,
    description,
    type,
    services,
    timestamp,
    resolved_timestamp,
  } = incident;

  if (id) {
    // Update existing incident
    const updateStmt = db.prepare(`
      UPDATE incidents
      SET title = ?, description = ?, type = ?, services = ?, timestamp = ?, resolved_timestamp = ?
      WHERE id = ?
    `);
    updateStmt.run(
      title,
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
      INSERT INTO incidents (title, description, type, services, timestamp, resolved_timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertStmt.run(
      title,
      description,
      type,
      services,
      timestamp,
      resolved_timestamp,
    );
    let formattedType =
      type.trim().charAt(0).toUpperCase() + type.trim().slice(1);
    await sendMail({
      subject: `${formattedType} - ${title}`,
      html: `
        <h1>${config.name} - ${formattedType}</h1>
        <p>${description}</p>
        <p>Services affected: ${services}</p>
      `,
    });
  }
}

// Helper function to delete an incident
async function deleteIncident(id: number) {
  const deleteStmt = db.prepare("DELETE FROM incidents WHERE id = ?");
  deleteStmt.run(id);
}

export const GET: APIRoute = async () => {
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
    const data = await request.json();

    await createOrUpdateIncident(data);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Failed to save incident:", error); // Log the detailed error
    return new Response(JSON.stringify({ error: "Failed to save incident" }), {
      status: 500,
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();
    if (!id || isNaN(id)) {
      return new Response(JSON.stringify({ error: "Invalid ID" }), {
        status: 400,
      });
    }

    await deleteIncident(id);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to delete incident" }),
      { status: 500 },
    );
  }
};
