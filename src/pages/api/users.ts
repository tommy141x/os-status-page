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

// POST: Add or update user
export const POST: APIRoute = async ({ request }) => {
  const db = new Database("statusdb.sqlite");

  try {
    const body = await request.json();
    const { id, email, permLevel, password } = body;

    if (!email) {
      db.close();
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const userExists =
      db.prepare("SELECT COUNT(*) as count FROM users WHERE id = ?").get(id)
        .count > 0;

    if (!userExists) {
      if (permLevel === undefined || !password) {
        db.close();
        return new Response(
          JSON.stringify({
            error: "permLevel and password are required for adding a new user",
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }

      const hashedPassword = await Bun.password.hash(password);

      const stmt = db.prepare(
        "INSERT INTO users (id, email, permLevel, password) VALUES (?, ?, ?, ?)",
      );
      stmt.run(id, email, permLevel, hashedPassword);
    } else {
      const updateFields = [];
      const updateValues = [];

      if (email) {
        updateFields.push("email = ?");
        updateValues.push(email);
      }
      if (permLevel !== undefined) {
        updateFields.push("permLevel = ?");
        updateValues.push(permLevel);
      }
      if (password) {
        const hashedPassword = await Bun.password.hash(password);
        updateFields.push("password = ?");
        updateValues.push(hashedPassword);
      }
      updateValues.push(id);
      const stmt = db.prepare(
        `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
      );
      stmt.run(...updateValues);
    }

    db.close();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Database operation error:", error);
    db.close();

    return new Response(
      JSON.stringify({ error: "Failed to add or update user" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};

// DELETE: Delete user
export const DELETE: APIRoute = async ({ request }) => {
  const db = new Database("statusdb.sqlite");

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      db.close();
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const stmt = db.prepare("DELETE FROM users WHERE id = ?");
    stmt.run(id);
    db.close();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Database operation error:", error);
    db.close();

    return new Response(JSON.stringify({ error: "Failed to delete user" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
