import type { TestResponse, TestNameResponse, TestRequest } from "@/types/api";
import type { EndpointMetadata } from "@/types/endpoint-metadata";

export const test = {
  "/api/test": {
    async GET(req: Bun.BunRequest): Promise<Response> {
      const response: TestResponse = {
        message: "Hello, world!",
        method: "GET",
      };
      return Response.json(response);
    },
    async PUT(req: Bun.BunRequest): Promise<Response> {
      const body = (await req.json().catch(() => ({}))) as Partial<TestRequest>;
      const response: TestResponse = {
        message: `Hello, ${body.name || "world"}!`,
        method: "PUT",
      };
      return Response.json(response);
    },
    async POST(req: Bun.BunRequest): Promise<Response> {
      const body = (await req.json().catch(() => ({}))) as Partial<TestRequest>;
      const response: TestResponse = {
        message: `Created: ${body.name || "item"}!`,
        method: "POST",
      };
      return Response.json(response);
    },
  },

  "/api/test/:name": async (req: Bun.BunRequest<"/api/test/:name">): Promise<Response> => {
    const name = req.params.name;
    const response: TestNameResponse = {
      message: `Hello, ${name}!`,
    };
    return Response.json(response);
  },
};

// Endpoint metadata with types and mock data
export const testMetadata: Record<string, EndpointMetadata> = {
  "/api/test": {
    path: "/api/test",
    description: "Test endpoint",
    methods: [
      {
        method: "GET",
        responseType: "TestResponse",
        mockData: {
          message: "Hello, world!",
          method: "GET",
        },
      },
      {
        method: "PUT",
        requestType: "TestRequest",
        responseType: "TestResponse",
        description: "Update test item",
        mockData: {
          message: "Hello, world!",
          method: "PUT",
        },
      },
      {
        method: "POST",
        requestType: "TestRequest",
        responseType: "TestResponse",
        description: "Create test item",
        mockData: {
          message: "Created: test item!",
          method: "POST",
        },
      },
    ],
  },
  "/api/test/:name": {
    path: "/api/test/:name",
    description: "Test with name parameter",
    methods: [
      {
        method: "GET",
        responseType: "TestNameResponse",
        mockData: {
          message: "Hello, Test!",
        },
      },
    ],
  },
};