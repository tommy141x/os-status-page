import type { APIRoute } from "astro";
import { Database } from "bun:sqlite";
import { loadConfig } from "@/lib/server-utils";

export const GET: APIRoute = async ({ url }) => {
  const db = new Database("statusdb.sqlite");
  const config = await loadConfig();

  const checkIntervalMinutes = config.check_interval_minutes || 15;
  const hoursBack = config.data_retention_hours || 24;

  const totalMinutes = hoursBack * 60;
  const intervals = Math.floor(totalMinutes / checkIntervalMinutes);
  const intervalDurationMs = checkIntervalMinutes * 60 * 1000;

  try {
    const earliestTimestamp = Date.now() - hoursBack * 60 * 60 * 1000;

    const services = db
      .prepare(
        `
      SELECT url, status, response_time, MAX(timestamp) as latest_timestamp
      FROM services
      WHERE timestamp >= ?
      GROUP BY url
    `,
      )
      .all(earliestTimestamp);

    const allConfiguredServices = config.categories.flatMap(
      (category) => category.services,
    );
    const validServices = allConfiguredServices.map((configService) => {
      const service = services.find((s) => s.url === configService.url);
      return service
        ? service
        : {
            url: configService.url,
            status: null,
            latest_timestamp: null,
            response_time: null,
          };
    });

    const overallStatus = validServices.every((s) => s.status === "online")
      ? "online"
      : "issues";

    const hourlyStatus = {};
    const uptimePercentages = {};
    validServices.forEach((service) => {
      const statusData = db
        .prepare(
          `
        SELECT status, timestamp, response_time
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
        return matchingStatus
          ? {
              status: matchingStatus.status,
              response_time: matchingStatus.response_time,
            }
          : { status: null, response_time: null };
      });

      hourlyStatus[service.url] = statuses;

      const onlineCount = statuses.filter(
        (status) => status.status === "online",
      ).length;
      uptimePercentages[service.url] = (onlineCount / intervals) * 100;
    });

    const timeRange =
      hoursBack <= 24
        ? `${hoursBack} hours`
        : `${Math.round(hoursBack / 24)} days`;

    const categoriesWithServices = config.categories.map((category) => {
      const servicesInCategory = category.services.map((configService) => {
        const service = validServices.find((s) => s.url === configService.url);

        return {
          name: configService.name,
          description: configService.description,
          url: configService.url,
          hide_url: configService.hide_url,
          expected_response_code: configService.expected_response_code,
          latest_timestamp: service ? service.latest_timestamp : null,
          status: service ? service.status : "offline",
          response_time: service ? service.response_time : null, // Include response_time
          hourly_status: hourlyStatus[configService.url],
          uptime_percentage:
            uptimePercentages[configService.url].toFixed(2) + "%",
        };
      });

      return {
        name: category.name,
        description: category.description,
        services: servicesInCategory,
      };
    });

    return new Response(
      JSON.stringify({
        categories: categoriesWithServices,
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
