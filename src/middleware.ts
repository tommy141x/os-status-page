import { Database } from "bun:sqlite";
import type { MiddlewareResponseHandler } from "astro";
import { defineMiddleware } from "astro/middleware";

const middleware: MiddlewareResponseHandler = async (context, next) => {
  const db = new Database("statusdb.sqlite");
  const setupCheck = await db.query("SELECT COUNT(*) AS count FROM users");
  const results = setupCheck.all();
  const isEmpty = results[0].count === 0;

  // Get the current page URL

  const currentPath = context.url.pathname;

  // Redirect to setup page if the users table is empty and not already on the setup page
  if (isEmpty && currentPath !== "/setup") {
    return Response.redirect(new URL("/setup", context.url), 302);
  }

  db.close();

  // return a Response or the result of calling `next()`
  return next();
};

export const onRequest = middleware;
