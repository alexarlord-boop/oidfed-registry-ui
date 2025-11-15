"use client"
import React from "react";
import { Pie, PieChart } from "recharts";
import { useGetLogs } from "@/api/apiComponents";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";

export const ChartLogsPie: React.FC<{ limit?: number }> = ({ limit = 200 }) => {
  const { data } = useGetLogs({ queryParams: { limit } });
  const logs: any[] = (data as any) ?? [];
  const counts = logs.reduce<Record<string, number>>((acc, l) => {
    const sev = l.severity ?? "Unknown";
    acc[sev] = (acc[sev] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(counts).map(([k, v]) => ({ browser: k, visitors: v }));

  const chartConfig = {
    visitors: { label: "Count" },
  } as any;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs by Severity</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={chartData} dataKey="visitors" nameKey="browser" />
            <ChartLegend content={<ChartLegendContent nameKey="browser" />} className="-translate-y-2 flex-wrap gap-2" />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default ChartLogsPie;
