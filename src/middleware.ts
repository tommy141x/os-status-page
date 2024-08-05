import { Database } from "bun:sqlite";
import type { MiddlewareResponseHandler } from "astro";
import { defineMiddleware } from "astro/middleware";
import * as jwt from "jsonwebtoken";
import { loadConfig } from "@/lib/server-utils";

const middleware: MiddlewareResponseHandler = async (context, next) => {
  const db = new Database("statusdb.sqlite");
  let config = await loadConfig();
  const JWT_SECRET = config.secret;

  const setupCheck = await db.query("SELECT COUNT(*) AS count FROM users");
  const results = setupCheck.all();
  const isEmpty = results[0].count === 0;

  // Get the current page URL and method
  const currentPath = context.url.pathname;
  const method = context.request.method;

  // Send user to setup page if no users are in the database
  if (isEmpty && method === "GET" && currentPath !== "/setup") {
    db.close();
    return Response.redirect(new URL("/setup", context.url), 302);
  } else if (!isEmpty && currentPath === "/setup") {
    db.close();
    return Response.redirect(new URL("/", context.url), 302);
  }

  // Check if user is logged in via session cookie token and pass their user data to the context
  const cookies = context.request.headers.get("cookie");
  let token;

  if (cookies) {
    const tokenMatch = cookies.match(/token=([^;]+)/);
    if (tokenMatch) {
      token = tokenMatch[1];
    }
  }

  if (token) {
    try {
      // Verify the token
      const decoded = jwt.verify(token, JWT_SECRET);
      const username = decoded.username;

      // Fetch user data from the database
      const userStmt = db.prepare(
        "SELECT username, permLevel FROM users WHERE username = ?",
      );
      const userData = userStmt.get(username);

      if (userData) {
        // Attach user data to the context
        if (currentPath === "/login") {
          db.close();
          return Response.redirect(new URL("/", context.url), 302);
        }
        context.locals.user = {
          username: userData.username,
          permLevel: userData.permLevel,
        };
      }
    } catch (error) {
      console.error("Error verifying token:", error);
      // Handle token verification errors if necessary
    }
  }

  db.close();
  return next();
};

export const onRequest = middleware;
