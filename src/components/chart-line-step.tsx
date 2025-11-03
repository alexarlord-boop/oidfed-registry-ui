"use client"

import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "A line chart with step"

const chartData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 105 },
  { month: "March", desktop: 137 },
  { month: "April", desktop: 73 },
  { month: "May", desktop: 109 },
  { month: "June", desktop: 214 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function ChartLineStep() {
  return (
    
        <ChartContainer config={chartConfig} className="h-[30vh] mx-auto">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              dataKey="desktop"
              type="step"
              stroke="var(--color-desktop)"
              strokeWidth={2}
              dot={true}
            />
          </LineChart>
        </ChartContainer>
     
  )
}
