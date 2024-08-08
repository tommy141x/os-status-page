// Services.tsx
import { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Area, AreaChart, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components//ui/chart";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import {
  GearIcon,
  CrossCircledIcon,
  CheckCircledIcon,
  ShadowIcon,
  MinusCircledIcon,
  QuestionMarkCircledIcon,
} from "@radix-ui/react-icons";

const getStatusColor = (status, isText) => {
  switch (status) {
    case "online":
      return isText ? "text-green-500" : "bg-green-500";
    case "issues":
      return isText ? "text-yellow-500" : "bg-yellow-500";
    case "offline":
      return isText ? "text-red-500" : "bg-red-500";
    default:
      return isText ? "text-gray-500" : "bg-gray-500";
  }
};

const formatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "numeric",
  hour12: true,
});

const StatusIconMap = ({ status, size }) => {
  // Determine the appropriate icon and color based on status
  let Icon, colorClass;

  switch (status) {
    case "online":
      Icon = CheckCircledIcon;
      colorClass = "text-green-500";
      break;
    case "issues":
      Icon = MinusCircledIcon;
      colorClass = "text-yellow-500";
      break;
    case "offline":
      Icon = CrossCircledIcon;
      colorClass = "text-red-500";
      break;
    default:
      Icon = QuestionMarkCircledIcon;
      colorClass = "text-gray-500";
      break;
  }

  return (
    <Icon
      className={`mr-2 ${colorClass}`}
      style={{ width: size, height: size }}
    />
  );
};

const StatusChart = ({ data }) => {
  return (
    <div className="flex h-8 w-full">
      {data.map((entry, index) => {
        const { status, response_time } = entry;
        const isFirst = index === 0;
        const isLast = index === data.length - 1;

        const borderRadiusClasses = `
          ${isFirst ? "rounded-l-md" : ""}
          ${isLast ? "rounded-r-md" : ""}
        `;

        return (
          <HoverCard key={`status-${status}-${index}`}>
            <HoverCardTrigger asChild>
              <div
                className={`flex-grow ${getStatusColor(status, false)} mx-px cursor-pointer ${borderRadiusClasses} group relative`}
              >
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-muted pointer-events-none" />
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-64 cursor-default">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-semibold capitalize">
                    {status || "No data"}
                  </h4>
                  <StatusIconMap status={status} size="1rem" />
                </div>
                {status && (
                  <>
                    <p className="text-xs text-muted-foreground">
                      {formatter.format(
                        Date.now() - (data.length - 1 - index) * 60 * 60 * 1000,
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Response Time:{" "}
                      {response_time !== null ? `${response_time} ms` : "N/A"}
                    </p>
                  </>
                )}
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      })}
    </div>
  );
};

const IncidentCard = ({ incident, statusData }) => {
  const isOngoing = incident.resolved_timestamp
    ? incident.resolved_timestamp > Date.now()
    : true;

  if (!isOngoing) return null;

  const affectedServices = (incident.services || "")
    .split(",")
    .map((serviceUrl) => {
      const trimmedUrl = serviceUrl.trim();
      if (!trimmedUrl) return null;

      return statusData.categories
        .flatMap((category) => category.services)
        .find((service) => service.url === trimmedUrl);
    })
    .filter((service) => service);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>
          <Badge
            variant="secondary"
            className={
              incident.type === "incident"
                ? "bg-red-500 cursor-default"
                : "bg-yellow-500 cursor-default"
            }
          >
            {incident.type === "incident" ? "Incident" : "Maintenance"}
          </Badge>
          <span className="ml-2 text-lg font-semibold">{incident.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>{incident.description}</p>
        {affectedServices.length > 0 && (
          <div className="mt-2">
            <h4 className="font-bold text-lg">Affected Services:</h4>
            <ul>
              {affectedServices.map((service) => (
                <li
                  key={service.url}
                  className="font-semibold flex items-center"
                >
                  <ShadowIcon className="mr-1" />
                  {service.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <span className="text-sm text-gray-500">
          Started {formatter.format(incident.timestamp * 1000)}
        </span>
      </CardFooter>
    </Card>
  );
};

export const Services = memo(({ statusData, incidentsData }) => {
  if (!statusData) return null;

  const allDates = new Set();
  statusData.categories.forEach((category) => {
    category.services.forEach((service) => {
      service.hourly_status.forEach((entry, index) => {
        if (entry.response_time !== null) {
          allDates.add(`2024-01-0${index + 1}`);
        }
      });
    });
  });

  // Convert the set to an array and sort it
  const datesArray = Array.from(allDates).sort();

  // Step 2: Initialize series and chartData
  const chartData = [];
  const series = {};

  // Function to generate a random shade of a base color
  function getRandomShade(baseColor) {
    const [r, g, b] = baseColor.match(/\w\w/g).map((hex) => parseInt(hex, 16));
    const randomFactor = Math.random(); // Adjust the shade by a factor
    const newR = Math.min(255, Math.floor(r * randomFactor));
    const newG = Math.min(255, Math.floor(g * randomFactor));
    const newB = Math.min(255, Math.floor(b * randomFactor));
    return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
  }

  function getBaseColor(status) {
    switch (status) {
      case "online":
        return "hsl(120, 100%, 50%)"; // Green
      case "issues":
        return "hsl(60, 100%, 50%)"; // Yellow
      case "offline":
        return "hsl(0, 100%, 50%)"; // Red
      default:
        return "hsl(0, 0%, 0%)"; // Default to black if status is unknown
    }
  }

  function randomizeHue(hslColor, range = 30) {
    let [h, s, l] = hslColor.match(/\d+/g).map(Number);
    const randomShift = Math.random() * range * 2 - range; // Random shift within the range
    h = (h + randomShift) % 360;
    if (h < 0) h += 360; // Ensure hue is within 0-360 range
    return `hsl(${Math.round(h)}, ${s}%, ${l}%)`;
  }

  // Updated code
  datesArray.forEach((date) => {
    const dataPoint = { date };
    statusData.categories.forEach((category) => {
      category.services.forEach((service) => {
        const entry = service.hourly_status.find(
          (e) =>
            e.response_time !== null &&
            date === `2024-01-0${service.hourly_status.indexOf(e) + 1}`,
        );
        if (entry) {
          dataPoint[service.name] = entry.response_time;
          if (!series[service.name]) {
            const baseColor = getBaseColor(service.status);
            series[service.name] = {
              dataKey: service.name,
              color: randomizeHue(baseColor),
            };
          }
        }
      });
    });
    chartData.push(dataPoint);
  });

  return (
    <div className="flex-grow p-4 overflow-auto max-w-7xl mx-auto w-full">
      <section className="text-center my-12 cursor-default">
        {statusData.overallStatus === "online" ? (
          <div className="flex flex-col items-center">
            <StatusIconMap status={statusData.overallStatus} size="3rem" />
            <h1 className="text-primary font-bold text-4xl my-4">
              All services are online
            </h1>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <StatusIconMap status={statusData.overallStatus} size="3rem" />
            <h1 className="text-primary font-bold text-4xl my-4">
              Some services are having issues
            </h1>
          </div>
        )}
        <p className="text-md mb-6 text-muted-foreground">
          Last updated {formatter.format(statusData.lastUpdate)}
        </p>
      </section>
      {incidentsData.map((incident) => (
        <IncidentCard
          key={incident.id}
          incident={incident}
          statusData={statusData}
        />
      ))}
      {statusData.categories.map((category, categoryIndex) => (
        <Card key={categoryIndex} className="bg-secondary mb-8">
          <CardHeader>
            <div
              className="flex justify-between items-center"
              style={{ fontSize: "1.5rem" }}
            >
              <CardTitle>{category.name}</CardTitle>
              <Badge className="cursor-default">
                {category.services.every(
                  (service) => service.status === "online",
                )
                  ? "Operational"
                  : "Issues Detected"}
              </Badge>
            </div>
            <CardDescription>{category.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8 mb-4">
              {category.services.map((service) => (
                <div key={service.name} className="p-4">
                  <div className="flex justify-between items-center">
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        {service.hide_url ? (
                          <Button
                            variant="ghost"
                            className="text-xl text-primary font-semibold -ml-4 flex items-center mb-2 cursor-default"
                          >
                            <StatusIconMap
                              status={service.status}
                              size="1.4rem"
                            />
                            {service.name}
                          </Button>
                        ) : (
                          <Button
                            variant="link"
                            className="text-xl text-primary font-semibold -ml-4 flex items-center mb-2"
                            onClick={() => window.open(service.url, "_blank")}
                          >
                            <StatusIconMap
                              status={service.status}
                              size="1.4rem"
                            />
                            {service.name}
                          </Button>
                        )}
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80 cursor-default">
                        <div className="flex justify-between space-x-4">
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold">
                              {service.name}
                            </h4>
                            <p className="text-sm">
                              {service.description || "No description"}
                            </p>
                            <div className="flex items-center pt-2">
                              <span className="text-xs text-muted-foreground">
                                {formatter.format(service.latest_timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                    <h2
                      className={`${getStatusColor(service.status, true)} mb-2`}
                    >
                      {service.uptime_percentage} uptime
                    </h2>
                  </div>
                  <StatusChart
                    data={service.hourly_status || new Array(30).fill(null)}
                  />
                  <div className="flex justify-between items-center p-1">
                    <h2 className="text-sm text-muted-foreground mt-2">
                      {statusData.timeRange} ago
                    </h2>
                    <h2 className="text-sm text-muted-foreground mt-2">Now</h2>
                  </div>
                  <Separator className="mt-4 -mb-8 bg-background" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      <Card className="bg-secondary mb-8 h-[300px] flex flex-col overflow-hidden">
        <CardHeader className="space-y-0 pb-0">
          <CardTitle className="flex items-baseline text-2xl tabular-nums">
            Response Times
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <ChartContainer
            className="w-full h-full"
            config={{
              time: {
                label: "Time",
                color: "hsl(var(--chart-2))",
              },
            }}
          >
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 0,
                right: 0,
                top: 20,
                bottom: 0,
              }}
              className="w-full h-full"
            >
              <XAxis dataKey="date" hide />
              <YAxis domain={["dataMin - 5", "dataMax + 2"]} hide />
              <defs>
                {Object.values(series).map(({ dataKey, color }) => (
                  <linearGradient
                    key={dataKey}
                    id={`fill${dataKey}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                  </linearGradient>
                ))}
              </defs>
              {Object.values(series).map(({ dataKey, color }) => (
                <Area
                  key={dataKey}
                  dataKey={dataKey}
                  type="natural"
                  fill={`url(#fill${dataKey})`}
                  fillOpacity={0.4}
                  stroke={color}
                />
              ))}
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
                formatter={(value, name) => {
                  const lineColor = series[name]?.color || "currentColor";
                  return (
                    <div className="flex flex-col text-xs text-muted-foreground mb-2">
                      <div className="flex items-center">
                        Service:
                        <div
                          className="ml-2 text-foreground"
                          style={{ color: lineColor }}
                        >
                          {name}
                        </div>
                      </div>
                      <div className="flex items-center mt-1">
                        Response Time:
                        <div className="ml-2 text-foreground">{value}ms</div>
                      </div>
                    </div>
                  );
                }}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
});
