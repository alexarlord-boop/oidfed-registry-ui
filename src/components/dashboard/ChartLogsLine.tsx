"use client"
import React from "react";
import { Line, LineChart, CartesianGrid, XAxis } from "recharts";
import { useGetLogs } from "@/api/apiComponents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export const ChartLogsLine: React.FC<{ limit?: number }> = ({ limit = 200 }) => {
  const { data } = useGetLogs({ queryParams: { limit } });
  const logs: any[] = (data as any) ?? [];

  // Aggregate counts by day (robust parsing of timestamps)
  const countsByDay: Record<string, number> = {};
  for (const l of logs) {
    const raw = l.timestamp;
    let t: Date | null = null;

    if (raw !== undefined && raw !== null) {
      if (typeof raw === "number") {
        t = new Date(raw);
        // if it's seconds (10-digit), convert to ms
        if (isNaN(t.getTime()) || t.getFullYear() === 1970) {
          if (String(raw).length === 10) {
            t = new Date(raw * 1000);
          }
        }
      } else if (typeof raw === "string") {
        t = new Date(raw);
        if (isNaN(t.getTime())) {
          const asNum = Number(raw);
          if (!isNaN(asNum)) {
            t = new Date(asNum);
            if ((isNaN(t.getTime()) || t.getFullYear() === 1970) && raw.length === 10) {
              t = new Date(asNum * 1000);
            }
          }
        }
      }
    }

    if (!t || isNaN(t.getTime())) {
      // skip entries with unparseable timestamps
      continue;
    }

    const key = t.toISOString().slice(0, 10);
    countsByDay[key] = (countsByDay[key] || 0) + 1;
  }
  const chartData = Object.keys(countsByDay)
    .sort()
    .map((k) => ({ month: k, desktop: countsByDay[k] }));

  const chartConfig = { desktop: { label: "Entries", color: "var(--chart-1)" } } as any;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[30vh] mx-auto">
          <LineChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => v.slice(5)} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Line dataKey="desktop" type="step" stroke="var(--color-desktop)" strokeWidth={2} dot={true} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default ChartLogsLine;
