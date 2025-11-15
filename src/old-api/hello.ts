import type { HelloResponse, HelloNameResponse, HelloRequest } from "@/types/api";
import type { EndpointMetadata } from "@/types/endpoint-metadata";

// Type-safe request handlers
export const hello = {
  "/api/hello": {
    async GET(req: Bun.BunRequest): Promise<Response> {
      const response: HelloResponse = {
        message: "Hello, world!",
        method: "GET",
      };
      return Response.json(response);
    },
    async PUT(req: Bun.BunRequest): Promise<Response> {
      const body = (await req.json().catch(() => ({}))) as Partial<HelloRequest>;
      const response: HelloResponse = {
        message: `Hello, ${body.name || "world"}!`,
        method: "PUT",
      };
      return Response.json(response);
    },
  },

  "/api/hello/:name": async (req: Bun.BunRequest<"/api/hello/:name">): Promise<Response> => {
    const name = req.params.name;
    const response: HelloNameResponse = {
      message: `Hello, ${name}!`,
    };
    return Response.json(response);
  },
};

// Endpoint metadata with types and mock data
export const helloMetadata: Record<string, EndpointMetadata> = {
  "/api/hello": {
    path: "/api/hello",
    description: "Hello world endpoint",
    methods: [
      {
        method: "GET",
        responseType: "HelloResponse",
        mockData: {
          message: "Hello, world!",
          method: "GET",
        },
      },
      {
        method: "PUT",
        requestType: "HelloRequest",
        responseType: "HelloResponse",
        description: "Update hello message",
        mockData: {
          message: "Hello, world!",
          method: "PUT",
        },
      },
    ],
  },
  "/api/hello/:name": {
    path: "/api/hello/:name",
    description: "Hello with name parameter",
    methods: [
      {
        method: "GET",
        responseType: "HelloNameResponse",
        mockData: {
          message: "Hello, Test!",
        },
      },
    ],
  },
};