import { Database } from "bun:sqlite";
import { file } from "bun";
import yaml from "js-yaml";
import { loadConfig } from "./lib/server-utils";

const db = new Database("statusdb.sqlite");

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT,
    status TEXT CHECK(status IN ('online', 'maintenance', 'issues', 'offline')),
    response_time INTEGER,
    timestamp INTEGER
  );
  CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT,
    type TEXT CHECK(type IN ('incident', 'maintenance')),
    services TEXT,
    timestamp INTEGER,
    resolved_timestamp INTEGER
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    permLevel INTEGER
  );
  CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      subscription_date INTEGER
  );
`);

let config = await loadConfig();

// Check service status
async function checkService(
  service: ServiceConfig,
): Promise<{ status: string; responseTime: number }> {
  const timeout = 7000; // Set the timeout in milliseconds

  const startTime = Date.now();

  const fetchPromise = fetch(service.url).then((response) => {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (response.status === service.expected_response_code) {
      return { status: "online", responseTime };
    } else if (response.status >= 500) {
      return { status: "offline", responseTime };
    } else {
      return { status: "issues", responseTime };
    }
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => {
      reject(new Error("Request timed out"));
    }, timeout),
  );

  try {
    const result = await Promise.race([fetchPromise, timeoutPromise]);
    return result;
  } catch (error) {
    return { status: "offline", responseTime: timeout };
  }
}

// Update service status in the database
async function updateServiceStatus() {
  config = await loadConfig();
  const timestamp = Date.now();
  for (const category of config.categories) {
    for (const service of category.services) {
      const { status, responseTime } = await checkService(service);
      db.prepare(
        "INSERT INTO services (url, status, response_time, timestamp) VALUES (?, ?, ?, ?)",
      ).run(service.url, status, responseTime, timestamp);
    }
  }
}

// Remove old data from the database
function removeOldData() {
  const cutoffTimestamp =
    Date.now() - config.data_retention_hours * 60 * 60 * 1000;
  db.prepare("DELETE FROM services WHERE timestamp < ?").run(cutoffTimestamp);
}

// Periodically update service status and remove old data
setInterval(
  () => {
    updateServiceStatus();
    removeOldData();
  },
  config.check_interval_minutes * 60 * 1000,
);

console.log(
  "Updating website statuses every " +
    config.check_interval_minutes +
    " minutes.",
);

updateServiceStatus();
