import type { APIRoute } from "astro";
import { Database } from "bun:sqlite";

const db = new Database("statusdb.sqlite");

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email } = await request.json();
    console.log("POST request received with email:", email);

    if (!email) {
      return new Response("Email is required.", { status: 400 });
    }

    // Check if the email already exists in the subscriptions
    const existingSubscription = db
      .query("SELECT 1 FROM subscriptions WHERE email = ?", [email])
      .get();

    if (existingSubscription) {
      return new Response("Email is already subscribed.", { status: 400 });
    }

    // Attempt to insert the new subscription
    try {
      const result = db.exec(
        `
        INSERT INTO subscriptions (email, subscription_date)
        VALUES (?, ?)
      `,
        [email, Date.now()],
      );

      console.log("POST result:", result);

      if (result.changes === 0) {
        return new Response("Failed to add subscription.", { status: 500 });
      }

      return new Response("Subscription added successfully.", { status: 200 });
    } catch (error) {
      // Assuming error.message contains details about the error
      if (error.message.includes("UNIQUE constraint failed")) {
        return new Response("Email is already subscribed.", { status: 400 });
      } else {
        console.error("POST error:", error);
        return new Response("Failed to add subscription.", { status: 500 });
      }
    }
  } catch (error) {
    console.error("POST error:", error);
    return new Response("Failed to add subscription.", { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { email } = await request.json();

    if (!email) {
      return new Response("Email is required.", { status: 400 });
    }

    // Check if the email exists in the subscriptions
    const existingSubscription = db
      .query("SELECT 1 FROM subscriptions WHERE email = ?", [email])
      .get();

    if (!existingSubscription) {
      return new Response("Email is not subscribed.", { status: 404 });
    }

    // Delete subscription
    db.exec(
      `
      DELETE FROM subscriptions
      WHERE email = ?
    `,
      [email],
    );

    return new Response("Subscription removed successfully.", { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response("Failed to remove subscription.", { status: 500 });
  }
};

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");
    console.log("GET request received with email:", email);

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch all subscriptions for debugging purposes
    const allSubscriptions = db.query("SELECT * FROM subscriptions").all();
    console.log("All subscriptions:", allSubscriptions);

    // Execute the query to fetch the subscription date for the given email
    const result = db
      .query("SELECT subscription_date FROM subscriptions WHERE email = ?", [
        email,
      ])
      .get();
    console.log("GET query result:", result);

    if (result && result.subscription_date !== null) {
      // Convert the Unix timestamp to an ISO string
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
    } else {
      // Return a response indicating the subscription does not exist
      return new Response(JSON.stringify({ subscribed: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("GET error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to retrieve subscription status." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
