"use client";
import { Button } from "@/components/ui/button";
import { HeaderNav } from "@/components/headerNav";
import { useState, useEffect } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

import {
  GearIcon,
  CrossCircledIcon,
  CheckCircledIcon,
  MinusCircledIcon,
  QuestionMarkCircledIcon,
} from "@radix-ui/react-icons";

import { Badge } from "@/components/ui/badge";

import { Separator } from "@/components/ui/separator";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
                      {new Date(
                        Date.now() - (data.length - 1 - index) * 60 * 60 * 1000,
                      ).toLocaleString()}
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

export function Dashboard({ user }) {
  const [statusData, setStatusData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/status");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setStatusData(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) return <div className="bg-background">Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!statusData) return <div>No data available</div>;

  return (
    <HeaderNav
      user={user}
      tabs={[
        {
          value: "status",
          label: "Status",
          content: (
            <div className="flex-grow p-4 overflow-auto max-w-7xl mx-auto w-full">
              <section className="text-center my-12 cursor-default">
                {statusData.overallStatus === "online" ? (
                  <div className="flex flex-col items-center">
                    <StatusIconMap
                      status={statusData.overallStatus}
                      size="3rem"
                    />
                    <h1 className="text-primary font-bold text-4xl my-4">
                      All services are online
                    </h1>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <StatusIconMap
                      status={statusData.overallStatus}
                      size="3rem"
                    />
                    <h1 className="text-primary font-bold text-4xl my-4">
                      Some services are having issues
                    </h1>
                  </div>
                )}
                <p className="text-md mb-6 text-muted-foreground">
                  Last updated{" "}
                  {new Date(statusData.lastUpdate).toLocaleString()}
                </p>
              </section>

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
                                    onClick={() =>
                                      window.open(service.url, "_blank")
                                    }
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
                                        {new Date(
                                          service.latest_timestamp,
                                        ).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                            <h2
                              className={`${getStatusColor(
                                service.status,
                                true,
                              )} mb-2`}
                            >
                              {service.uptime_percentage} uptime
                            </h2>
                          </div>
                          <StatusChart
                            data={
                              service.hourly_status || new Array(30).fill(null)
                            }
                          />
                          <div className="flex justify-between items-center p-1">
                            <h2 className="text-sm text-muted-foreground mt-2">
                              {statusData.timeRange} ago
                            </h2>
                            <h2 className="text-sm text-muted-foreground mt-2">
                              Now
                            </h2>
                          </div>
                          <Separator className="mt-4 -mb-8 bg-background" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ),
        },
        {
          value: "incidents",
          label: "Incidents",
          content: (
            <div className="flex-grow p-4 overflow-auto max-w-7xl mx-auto w-full">
              <section className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4 text-primary">
                  Latest Incidents
                </h1>
                <p className="text-lg mb-6 text-foreground">hi</p>
              </section>
            </div>
          ),
        },
      ]}
    />
  );
}
