"use client";

import { Button } from "@/components/ui/button";
import { HeaderNav } from "@/components/headerNav";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#2563eb",
  },
  mobile: {
    label: "Mobile",
    color: "#60a5fa",
  },
};

// Define the tabs and their contents

export function Dashboard({ user }) {
  return (
    <HeaderNav
      user={user}
      tabs={[
        {
          value: "status",
          label: "Status",
          content: (
            <div className="flex-grow p-4 overflow-auto max-w-7xl mx-auto w-full">
              <section className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4 text-primary">
                  All services are online
                </h1>
                <p className="text-lg mb-6 text-foreground">
                  Last updated 2 minutes ago
                </p>
              </section>
              <ChartContainer
                config={chartConfig}
                className="min-h-[200px] w-full"
              >
                <BarChart accessibilityLayer data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="desktop"
                    fill="var(--color-desktop)"
                    radius={4}
                  />
                  <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
                </BarChart>
              </ChartContainer>
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
