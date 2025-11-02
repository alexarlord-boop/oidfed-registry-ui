export const dashboard = {
  "/api/dashboard/stats": {
    async GET(req: Bun.BunRequest) {
      return Response.json({
        message: "Dashboard stats",
        data: {
          totalUsers: 1234,
          activeUsers: 567,
          lastUpdated: new Date().toISOString(),
        },
      });
    },
  },
};