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

  const currentPath = context.url.pathname;
  const method = context.request.method;

  if (isEmpty && method === "GET" && currentPath !== "/setup") {
    db.close();
    return Response.redirect(new URL("/setup", context.url), 302);
  } else if (!isEmpty && currentPath === "/setup") {
    db.close();
    return Response.redirect(new URL("/", context.url), 302);
  }

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
      const decoded = jwt.verify(token, JWT_SECRET);
      const email = decoded.email;

      const userStmt = db.prepare(
        "SELECT email, permLevel FROM users WHERE email = ?",
      );
      const userData = userStmt.get(email);

      if (userData) {
        if (currentPath === "/login") {
          db.close();
          return Response.redirect(new URL("/", context.url), 302);
        }

        context.locals.user = {
          email: userData.email,
          permLevel: userData.permLevel,
        };
      }
    } catch (error) {
      console.error("Error verifying token:", error);
    }
  }

  if (currentPath === "/settings" && !(context.locals.user?.permLevel === 0)) {
    db.close();
    return Response.redirect(new URL("/", context.url), 302);
  }

  if (
    currentPath.startsWith("/api") &&
    method !== "GET" &&
    !context.locals.user &&
    !isEmpty &&
    currentPath.endsWith("/status") === false &&
    currentPath.endsWith("/login") === false &&
    currentPath.endsWith("/subscribe") === false
  ) {
    db.close();
    return new Response("Unauthorized", { status: 401 });
  }

  db.close();
  return next();
};

export const onRequest = middleware;
