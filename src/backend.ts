import { Database } from "bun:sqlite";
import { file } from "bun";
import yaml from "js-yaml";

const db = new Database("statusdb.sqlite");

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_name TEXT,
    status TEXT CHECK(status IN ('online', 'maintenance', 'issues', 'offline')),
    timestamp INTEGER
  );

  CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT,
    type TEXT,
    timestamp INTEGER,
    resolved_timestamp INTEGER
  );

  CREATE TABLE IF NOT EXISTS incident_services (
    incident_id INTEGER,
    service_id INTEGER,
    FOREIGN KEY (incident_id) REFERENCES incidents(id),
    FOREIGN KEY (service_id) REFERENCES services(id),
    PRIMARY KEY (incident_id, service_id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    permLevel INTEGER
  );
`);

// Interfaces
interface ServiceConfig {
  name: string;
  description: string;
  url: string;
  hide_url: boolean;
  expected_response_code: number;
}

interface Config {
  services: ServiceConfig[];
  data_retention_days: number;
  check_interval_seconds: number;
}

// Load configuration from YAML file
async function loadConfig(): Promise<Config> {
  console.log("Loading config");
  try {
    const configFile = file("config.yml");
    const configFileContent = await configFile.text();
    const config = yaml.load(configFileContent) as Config;
    return config;
  } catch (error) {
    console.error("Error loading configuration:", error);
    return {} as Config;
  }
}

let config = await loadConfig();

// Check service status
async function checkService(service: ServiceConfig): Promise<string> {
  try {
    const response = await fetch(service.url);
    if (response.status === service.expected_response_code) {
      return "online";
    } else if (response.status >= 500) {
      return "offline";
    } else {
      return "issues";
    }
  } catch (error) {
    return "offline";
  }
}

// Update service status in the database
async function updateServiceStatus() {
  const timestamp = Date.now();
  for (const service of config.services) {
    const status = await checkService(service);
    db.prepare(
      "INSERT INTO services (service_name, status, timestamp) VALUES (?, ?, ?)",
    ).run(service.name, status, timestamp);
  }
}

// Remove old data from the database
function removeOldData() {
  const cutoffTimestamp =
    Date.now() - config.data_retention_days * 24 * 60 * 60 * 1000;
  db.prepare("DELETE FROM services WHERE timestamp < ?").run(cutoffTimestamp);
}

// Periodically update service status and remove old data
setInterval(() => {
  updateServiceStatus();
  removeOldData();
}, config.check_interval_seconds * 1000);
updateServiceStatus();
