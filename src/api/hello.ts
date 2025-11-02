export const hello = {
  "/api/hello": {
    async GET(req: Bun.BunRequest) {
      return Response.json({
        message: "Hello, world!",
        method: "GET",
      });
    },
    async PUT(req: Bun.BunRequest) {
      return Response.json({
        message: "Hello, world!",
        method: "PUT",
      });
    },
  },

  "/api/hello/:name": async (req: Bun.BunRequest<"/api/hello/:name">) => {
    const name = req.params.name;
    return Response.json({
      message: `Hello, ${name}!`,
    });
  },
};