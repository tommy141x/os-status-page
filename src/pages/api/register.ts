import type { APIRoute } from "astro";
import { Database } from "bun:sqlite";
import * as jwt from "jsonwebtoken";
import { loadConfig } from "@/lib/server-utils";

const db = new Database("statusdb.sqlite");
let config = await loadConfig();
const JWT_SECRET = config.secret;

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    // Log the raw request body
    const rawBody = await request.text();

    // Parse the JSON manually
    let data;
    try {
      data = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return new Response("Invalid JSON in request body", { status: 400 });
    }

    const { username, password } = data;

    if (!username || !password) {
      return new Response("Username and password are required", {
        status: 400,
      });
    }

    // Hash the password
    const hashedPassword = await Bun.password.hash(password);

    // Insert the new user into the database
    const stmt = db.prepare(`
      INSERT INTO users (username, password, permLevel)
      VALUES (?, ?, ?)
    `);
    stmt.run(username, hashedPassword, 0);

    // Duration in seconds for 3 weeks
    const THREE_WEEKS_IN_SECONDS = 3 * 7 * 24 * 60 * 60; // 1814400 seconds

    // Create a JWT token for the session with a 3-week expiration
    const token = jwt.sign({ username }, JWT_SECRET, {
      expiresIn: THREE_WEEKS_IN_SECONDS,
    });

    // Set the token as a cookie
    const headers = new Headers();
    headers.set(
      "Set-Cookie",
      `token=${token}; HttpOnly; Path=/; Max-Age=${THREE_WEEKS_IN_SECONDS}`,
    );
    headers.set("Location", "/");
    return new Response(null, { status: 302, headers });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return new Response("Username already exists", { status: 409 });
    }
    return new Response("An error occurred during registration", {
      status: 500,
    });
  }
};
