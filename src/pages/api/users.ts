import type { APIRoute } from "astro";
import { Database } from "bun:sqlite";

// GET: Fetch all users
export const GET: APIRoute = async ({ url }) => {
  const db = new Database("statusdb.sqlite");

  try {
    const users = db.prepare("SELECT * FROM users").all();
    db.close();

    return new Response(JSON.stringify(users), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Database query error:", error);
    db.close();

    return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};

// POST: Update user
export const POST: APIRoute = async ({ request }) => {
  const db = new Database("statusdb.sqlite");

  try {
    const body = await request.json();
    const { id, email, permLevel } = body;

    if (!id || !email || permLevel === undefined) {
      db.close();
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    const stmt = db.prepare(
      "UPDATE users SET email = ?, permLevel = ? WHERE id = ?",
    );
    stmt.run(email, permLevel, id);
    db.close();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Database update error:", error);
    db.close();

    return new Response(JSON.stringify({ error: "Failed to update user" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
