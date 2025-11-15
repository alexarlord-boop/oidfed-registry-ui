import type { DashboardStatsResponse } from "@/types/api";
import type { EndpointMetadata } from "@/types/endpoint-metadata";

export const dashboard = {
  "/api/dashboard/stats": {
    async GET(req: Bun.BunRequest): Promise<Response> {
      const response: DashboardStatsResponse = {
        message: "Dashboard stats",
        data: {
          totalUsers: 1234,
          activeUsers: 567,
          lastUpdated: new Date().toISOString(),
        },
      };
      return Response.json(response);
    },
  },
};

// Endpoint metadata with types and mock data
export const dashboardMetadata: Record<string, EndpointMetadata> = {
  "/api/dashboard/stats": {
    path: "/api/dashboard/stats",
    description: "Get dashboard statistics",
    methods: [
      {
        method: "GET",
        responseType: "DashboardStatsResponse",
        mockData: {
          message: "Dashboard stats",
          data: {
            totalUsers: 1234,
            activeUsers: 567,
            lastUpdated: new Date().toISOString(),
          },
        },
      },
    ],
  },
};