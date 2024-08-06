import type { APIRoute } from "astro";
import { Database } from "bun:sqlite";
import { loadConfig } from "@/lib/server-utils";

export const GET: APIRoute = async ({ url }) => {
  const db = new Database("statusdb.sqlite");
  const config = await loadConfig();

  const checkIntervalMinutes = config.check_interval_minutes || 15; // Default to checking every 15 minutes
  const hoursBack = config.retention_hours || 24; // Default to 24 hours back

  // Total minutes we are interested in (e.g., 24 hours)
  const totalMinutes = hoursBack * 60;
  const intervals = Math.floor(totalMinutes / checkIntervalMinutes); // Calculate number of intervals
  const intervalDurationMs = checkIntervalMinutes * 60 * 1000; // Duration of each interval in milliseconds

  try {
    // Get the timestamp for the earliest point we care about
    const earliestTimestamp = Date.now() - hoursBack * 60 * 60 * 1000;

    // Get latest service statuses
    const services = db
      .prepare(
        `
      SELECT url, status, MAX(timestamp) as latest_timestamp
      FROM services
      WHERE timestamp >= ?
      GROUP BY url
    `,
      )
      .all(earliestTimestamp);

    // Filter out services not in the config using URL
    const configuredServices = config.services;
    const validServices = configuredServices.map((configService) => {
      const service = services.find((s) => s.url === configService.url);
      return service
        ? service
        : { url: configService.url, status: null, latest_timestamp: null };
    });

    // Get overall status
    const overallStatus = validServices.every((s) => s.status === "online")
      ? "online"
      : "issues";

    // Get status for each service for the specified number of intervals
    const hourlyStatus = {};
    const uptimePercentages = {};
    validServices.forEach((service) => {
      const statusData = db
        .prepare(
          `
        SELECT status, timestamp
        FROM services
        WHERE url = ? AND timestamp >= ?
        ORDER BY timestamp DESC
        LIMIT ?
      `,
        )
        .all(service.url, earliestTimestamp, intervals);

      const statuses = new Array(intervals).fill(null).map((_, i) => {
        const currentTimestamp =
          Date.now() - (intervals - 1 - i) * intervalDurationMs;
        const matchingStatus = statusData.find(
          (s) => s.timestamp <= currentTimestamp,
        );
        return matchingStatus ? matchingStatus.status : null;
      });

      hourlyStatus[service.url] = statuses;

      // Calculate uptime percentage
      const onlineCount = statuses.filter(
        (status) => status === "online",
      ).length;
      uptimePercentages[service.url] = (onlineCount / intervals) * 100;
    });

    // Human-readable time range
    const timeRange =
      hoursBack <= 24
        ? `${hoursBack} hours`
        : `${Math.round(hoursBack / 24)} days`;

    // Combine all data with additional config details
    const servicesWithHourlyStatus = configuredServices.map((configService) => {
      const service = validServices.find((s) => s.url === configService.url);

      return {
        name: configService.name,
        description: configService.description,
        url: configService.url,
        hide_url: configService.hide_url,
        expected_response_code: configService.expected_response_code,
        latest_timestamp: service ? service.latest_timestamp : null,
        status: service ? service.status : "offline",
        hourly_status: hourlyStatus[configService.url],
        uptime_percentage:
          uptimePercentages[configService.url].toFixed(2) + "%",
      };
    });

    return new Response(
      JSON.stringify({
        services: servicesWithHourlyStatus,
        overallStatus,
        lastUpdate: Date.now(),
        timeRange,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching status data:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } finally {
    db.close();
  }
};
