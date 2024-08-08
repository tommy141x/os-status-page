import { Database } from "bun:sqlite";
import { faker } from "@faker-js/faker";
import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";

// Connect to the database
const db = new Database("statusdb.sqlite");

// Helper function to generate a consistent status with a chance to change
function generateStatusChanges(
  startTimestamp: number,
  interval: number,
  numChecks: number,
) {
  const statusWeights = {
    online: 0.7, // 70% chance
    issues: 0.2, // 20% chance
    offline: 0.1, // 10% chance
  };

  // Calculate the cumulative weights
  const statuses = Object.keys(statusWeights);
  const cumulativeWeights = statuses.reduce((acc, status) => {
    const weight = statusWeights[status];
    acc[status] = (acc[statuses[statuses.length - 1]] || 0) + weight;
    return acc;
  }, {});

  let currentStatus = faker.helpers.arrayElement(statuses);
  const changeChance = 0.1; // 10% chance for a permanent status change

  const checks = [];
  for (let i = 0; i < numChecks; i++) {
    const timestamp = startTimestamp + i * interval;

    // Change status permanently with a 10% chance
    if (Math.random() < changeChance) {
      const random = Math.random();
      currentStatus = statuses.find(
        (status) =>
          random <
          cumulativeWeights[status] /
            cumulativeWeights[statuses[statuses.length - 1]],
      );
    }

    checks.push({ status: currentStatus, timestamp });
  }

  return checks;
}

// Helper function to generate random response times
function generateRandomResponseTimes(
  startTimestamp: number,
  interval: number,
  numChecks: number,
) {
  const responseTimes = [];
  for (let i = 0; i < numChecks; i++) {
    const timestamp = startTimestamp + i * interval;
    const responseTime = faker.number.int({ min: 10, max: 5000 });
    responseTimes.push({ responseTime, timestamp });
  }

  return responseTimes;
}

// Helper function to merge status and response times
function mergeStatusAndResponseTimes(
  statusChecks: any[],
  responseTimes: any[],
) {
  return statusChecks.map((check, index) => ({
    ...check,
    response_time: responseTimes[index].responseTime,
  }));
}

// Helper function to generate fake incidents
function generateIncidents(numIncidents: number, services: string[]) {
  const incidents = [];
  for (let i = 0; i < numIncidents; i++) {
    const title = faker.lorem.sentence();
    const description = faker.lorem.paragraph();
    const type = faker.helpers.arrayElement(["incident", "maintenance"]);
    const incidentServices = faker.helpers
      .arrayElements(
        services,
        faker.number.int({ min: 1, max: services.length }),
      )
      .join(",");
    const timestamp = faker.date.past(1).getTime();
    const resolvedTimestamp = faker.datatype.boolean()
      ? faker.date.past(0.5).getTime()
      : null;

    incidents.push({
      title,
      description,
      type,
      services: incidentServices,
      timestamp,
      resolved_timestamp: resolvedTimestamp,
    });
  }

  return incidents;
}

// Helper function to generate fake data and configuration
async function generateFakeData() {
  // Generate random configuration values
  const dataRetentionHours = faker.number.int({ min: 12, max: 24 }).toString();
  const checkIntervalMinutes = faker.number.int({ min: 5, max: 20 }).toString();
  const checkIntervalMs = parseInt(checkIntervalMinutes, 10) * 60 * 1000;
  const totalChecks = Math.floor(
    (parseInt(dataRetentionHours, 10) * 60 * 60 * 1000) / checkIntervalMs,
  );

  const config: any = {
    categories: [],
    data_retention_hours: dataRetentionHours,
    check_interval_minutes: checkIntervalMinutes,
    name: faker.company.name(),
    mail: {
      smtp: {
        host: faker.internet.domainName(),
        port: faker.number.int({ min: 1, max: 65535 }).toString(),
        username: faker.internet.email(),
        password: faker.internet.password(),
      },
      send_from: faker.internet.email(),
      enabled: faker.datatype.boolean(),
    },
    secret: faker.internet.password(),
  };

  // Generate random categories and services
  const numCategories = faker.number.int({ min: 1, max: 3 });
  const allServices: string[] = [];
  for (let i = 0; i < numCategories; i++) {
    const categoryName = faker.commerce.department();
    const categoryDescription = faker.lorem.sentence();
    const services = [];

    const numServices = faker.number.int({ min: 1, max: 3 });
    for (let j = 0; j < numServices; j++) {
      const serviceName = faker.commerce.productName();
      const serviceDescription = faker.lorem.sentence();
      const serviceUrl = faker.internet.url();
      const hideUrl = faker.datatype.boolean();
      const expectedResponseCode = faker.number.int({ min: 200, max: 599 });

      const startTimestamp =
        Date.now() - parseInt(dataRetentionHours, 10) * 60 * 60 * 1000;

      // Generate status changes and response times
      const statusChecks = generateStatusChanges(
        startTimestamp,
        checkIntervalMs,
        totalChecks,
      );
      const responseTimes = generateRandomResponseTimes(
        startTimestamp,
        checkIntervalMs,
        totalChecks,
      );
      const statusAndResponse = mergeStatusAndResponseTimes(
        statusChecks,
        responseTimes,
      );

      // Insert status checks into the database
      for (const check of statusAndResponse) {
        db.prepare(
          "INSERT INTO services (url, status, response_time, timestamp) VALUES (?, ?, ?, ?)",
        ).run(serviceUrl, check.status, check.response_time, check.timestamp);
      }

      // Add service to config services array
      services.push({
        name: serviceName,
        description: serviceDescription,
        url: serviceUrl,
        hide_url: hideUrl,
        expected_response_code: expectedResponseCode,
      });
      allServices.push(serviceUrl);
    }

    // Add category to config categories array
    config.categories.push({
      name: categoryName,
      description: categoryDescription,
      services,
    });
  }

  // Generate random incidents
  const numIncidents = faker.number.int({ min: 1, max: 5 });
  const incidents = generateIncidents(numIncidents, allServices);

  // Insert incidents into the database
  for (const incident of incidents) {
    db.prepare(
      "INSERT INTO incidents (title, description, type, services, timestamp, resolved_timestamp) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(
      incident.title,
      incident.description,
      incident.type,
      incident.services,
      incident.timestamp,
      incident.resolved_timestamp,
    );
  }

  // Save config to file
  const configFilePath = path.resolve(process.cwd(), "config.yml");
  await fs.writeFile(configFilePath, yaml.dump(config), "utf8");

  console.log("Fake data and configuration inserted successfully.");
}

// Run the function to generate and insert fake data
generateFakeData();
