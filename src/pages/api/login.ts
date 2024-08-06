import type { APIRoute } from "astro";
import { Database } from "bun:sqlite";
import * as jwt from "jsonwebtoken";
import { loadConfig } from "@/lib/server-utils";

const db = new Database("statusdb.sqlite");
let config = await loadConfig();
const JWT_SECRET = config.secret;

export const POST: APIRoute = async ({ request }) => {
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

    const { email, password } = data;

    if (!email || !password) {
      return new Response("Email and password are required", {
        status: 400,
      });
    }

    // Fetch the user from the database
    const stmt = db.prepare(`
      SELECT * FROM users WHERE email = ?
    `);
    const user = stmt.get(email);

    if (!user) {
      return new Response("Invalid email or password", { status: 401 });
    }

    // Verify the password
    const isPasswordValid = await Bun.password.compare(password, user.password);
    if (!isPasswordValid) {
      return new Response("Invalid email or password", { status: 401 });
    }

    // Duration in seconds for 3 weeks
    const THREE_WEEKS_IN_SECONDS = 3 * 7 * 24 * 60 * 60; // 1814400 seconds

    // Create a JWT token for the session with a 3-week expiration
    const token = jwt.sign({ email }, JWT_SECRET, {
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
    console.error("An error occurred during login:", error);
    return new Response("An error occurred during login", {
      status: 500,
    });
  }
};
