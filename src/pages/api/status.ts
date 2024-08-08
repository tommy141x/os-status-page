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
    const services = db
      .prepare(
        `
      SELECT url, status, response_time, timestamp
      FROM services
    `,
      )
      .all();

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
            timestamp: null,
            response_time: null,
          };
    });

    const overallStatus = validServices.every((s) => s.status === "online")
      ? "online"
      : "issues";
    const statusData = {};
    const uptimePercentages = {};
    const timeRanges = {};

    validServices.forEach((service) => {
      const serviceStatusData = services
        .filter((s) => s.url === service.url)
        .map((s) => ({
          status: s.status,
          response_time: s.response_time,
          timestamp: s.timestamp,
        }));
      statusData[service.url] = serviceStatusData;

      const onlineCount = serviceStatusData.filter(
        (status) => status.status === "online",
      ).length;
      uptimePercentages[service.url] =
        (onlineCount / serviceStatusData.length) * 100;

      const earliestTimestamp = Math.min(
        ...serviceStatusData.map((s) => s.timestamp),
      );
      const hoursBackForService = Math.max(
        1,
        Math.round((Date.now() - earliestTimestamp) / (60 * 60 * 1000)),
      );
      timeRanges[service.url] =
        hoursBackForService <= 24
          ? `${hoursBackForService} hours`
          : `${Math.round(hoursBackForService / 24)} days`;
    });

    const categoriesWithServices = config.categories.map((category) => {
      const servicesInCategory = category.services.map((configService) => {
        const serviceData = statusData[configService.url];
        const service = validServices.find((s) => s.url === configService.url);
        return {
          name: configService.name,
          description: configService.description,
          url: configService.url,
          hide_url: configService.hide_url,
          expected_response_code: configService.expected_response_code,
          latest_timestamp: service ? service.timestamp : null,
          status: service ? service.status : "offline",
          response_time: service ? service.response_time : null,
          status_data: serviceData,
          uptime_percentage:
            uptimePercentages[configService.url].toFixed(2) + "%",
          timeRange: timeRanges[configService.url],
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
