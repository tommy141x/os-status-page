import type { APIRoute } from "astro";
import { Database } from "bun:sqlite";

const db = new Database("statusdb.sqlite");

const handleError = (error: unknown, message: string, status: number) => {
  console.error(error);
  return new Response(message, { status });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email } = await request.json();
    if (!email) return new Response("Email is required.", { status: 400 });

    // Prepare and execute the query to check if the email exists
    const checkStmt = db.prepare("SELECT 1 FROM subscriptions WHERE email = ?");
    const exists = checkStmt.get(email);
    if (exists)
      return new Response("Email is already subscribed.", { status: 400 });

    // Insert the new subscription
    const insertStmt = db.prepare(
      "INSERT INTO subscriptions (email, subscription_date) VALUES (?, ?)",
    );
    insertStmt.run(email, Date.now());

    return new Response("Subscription added successfully.", { status: 200 });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      return new Response("Email is already subscribed.", { status: 400 });
    }
    return handleError(error, "Failed to add subscription.", 500);
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { email } = await request.json();
    if (!email) return new Response("Email is required.", { status: 400 });

    // Prepare and execute the query to check if the email exists
    const checkStmt = db.prepare("SELECT 1 FROM subscriptions WHERE email = ?");
    const exists = checkStmt.get(email);
    if (!exists)
      return new Response("Email is not subscribed.", { status: 404 });

    // Delete the subscription
    const deleteStmt = db.prepare("DELETE FROM subscriptions WHERE email = ?");
    deleteStmt.run(email);

    return new Response("Subscription removed successfully.", { status: 200 });
  } catch (error) {
    return handleError(error, "Failed to remove subscription.", 500);
  }
};

export const GET: APIRoute = async ({ request }) => {
  try {
    const email = new URL(request.url).searchParams.get("email");
    if (!email)
      return new Response(JSON.stringify({ error: "Email is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

    // Prepare and execute the query to retrieve subscription details
    const stmt = db.prepare("SELECT * FROM subscriptions WHERE email = ?");
    const result = stmt.get(email);

    if (result) {
      const subscriptionDateISO = new Date(
        result.subscription_date,
      ).toISOString();
      return new Response(
        JSON.stringify({
          subscribed: true,
          subscription_date: subscriptionDateISO,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ subscribed: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleError(error, "Failed to retrieve subscription status.", 500);
  }
};
