import { Database } from "bun:sqlite";
import { loadConfig } from "./lib/server-utils";
import { sendMail } from "./lib/mail";

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
    title TEXT,
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
let lastConfig = JSON.stringify(config);
let updateInterval;

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
    return { status: "offline", responseTime: 0 };
  }
}

// Function to send an email alert
async function sendStatusAlert(serviceUrl: string, status: string) {
  // Find service details by URL
  let service = null;
  for (const category of config.categories) {
    for (const svc of category.services) {
      if (svc.url === serviceUrl) {
        service = svc;
        break;
      }
    }
    if (service) break;
  }

  if (!service) {
    console.error("Service not found in config");
    return;
  }

  // Determine whether to show the URL or not
  const hideUrlText = service.hide_url
    ? `<b>${service.name}</b>`
    : `<a href="${service.url}">${service.name}</a>`;

  // Send the email
  await sendMail({
    subject: `Service Status Alert: ${service.name}`,
    html: `
      <h1>${service.name} - Issues Detected</h1>
      <p>The service ${hideUrlText} is having issues currently.</p>
    `,
  });
}

// Check status history and send alert if needed
async function checkStatusHistory(service: ServiceConfig) {
  const rows = db
    .prepare(
      "SELECT status FROM services WHERE url = ? ORDER BY timestamp DESC LIMIT 3",
    )
    .all(service.url);

  if (rows.length < 3) {
    return; // Not enough data to make a decision
  }

  const [latest, previous, older] = rows;

  if (
    (latest.status === "issues" || latest.status === "offline") &&
    (previous.status === "issues" || previous.status === "offline") &&
    older.status === "online"
  ) {
    await sendStatusAlert(service.url, latest.status);
  }
}

// Update service status in the database
async function updateServiceStatus() {
  config = await loadConfig(); // Fetch the latest config
  const timestamp = Date.now();
  for (const category of config.categories) {
    for (const service of category.services) {
      const { status, responseTime } = await checkService(service);
      db.prepare(
        "INSERT INTO services (url, status, response_time, timestamp) VALUES (?, ?, ?, ?)",
      ).run(service.url, status, responseTime, timestamp);

      // Check if the service status is offline or issues, and if so, check its history
      if (status === "offline" || status === "issues") {
        await checkStatusHistory(service);
      }
    }
  }
}

// Remove old data from the database
function removeOldData() {
  const cutoffTimestamp =
    Date.now() - config.data_retention_hours * 60 * 60 * 1000;
  db.prepare("DELETE FROM services WHERE timestamp < ?").run(cutoffTimestamp);
}

// Compare the current config with the last config
function configHasChanged(currentConfig: any): boolean {
  const currentConfigStr = JSON.stringify(currentConfig);
  const hasChanged = currentConfigStr !== lastConfig;
  lastConfig = currentConfigStr; // Update the last config
  return hasChanged;
}

// Periodically check for config changes every 15 seconds
async function checkConfigChanges() {
  try {
    const currentConfig = await loadConfig(); // Fetch the latest config
    if (configHasChanged(currentConfig)) {
      console.log(
        "Configuration changed. Updating status and resetting update interval...",
      );
      await updateServiceStatus();
      clearInterval(updateInterval);
      scheduleUpdates();
      console.log("Status updated due to config change.");
    }
  } catch (error) {
    console.error("Error checking configuration:", error);
  }
}

setInterval(checkConfigChanges, 15000); // Check every 15 seconds

// Periodically update service status and remove old data based on config check interval
async function scheduleUpdates() {
  const checkInterval = config.check_interval_minutes * 60 * 1000;
  updateInterval = setInterval(async () => {
    try {
      await updateServiceStatus();
      removeOldData();
    } catch (error) {
      console.error("Error updating status or removing old data:", error);
    }
  }, checkInterval);
}

// Start the periodic update scheduling
console.log("Monitoring configuration changes and scheduling updates...");
scheduleUpdates();
