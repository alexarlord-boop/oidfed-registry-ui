#!/usr/bin/env bun
/**
 * Script to automatically generate API endpoints configuration
 * from the API files in src/api/
 * 
 * Run: bun run scripts/generate-api-endpoints.ts
 */

import { readdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const apiDir = join(projectRoot, "src/api");
const outputFile = join(projectRoot, "src/config/api-endpoints.ts");

interface MethodInfo {
  method: string;
  requestType?: string;
  responseType?: string;
  mockData?: unknown;
  description?: string;
}

interface ApiEndpoint {
  path: string;
  methods: string[];
  methodDetails?: MethodInfo[];
  description?: string;
}

// HTTP methods that are recognized
const HTTP_METHODS = new Set([
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "HEAD",
  "OPTIONS",
]);

function extractMethods(routeHandler: any): string[] {
  const methods: string[] = [];

  if (typeof routeHandler === "function") {
    // If it's a function, assume it's a GET handler
    methods.push("GET");
  } else if (typeof routeHandler === "object" && routeHandler !== null) {
    // Check for HTTP method properties
    for (const key in routeHandler) {
      if (HTTP_METHODS.has(key.toUpperCase()) && typeof routeHandler[key] === "function") {
        methods.push(key.toUpperCase());
      }
    }
  }

  return methods;
}

function generateDescription(path: string): string {
  // Generate a simple description based on the path
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return "";
  
  const lastPart = parts[parts.length - 1];
  const name = lastPart.replace(/:/g, "").replace(/-/g, " ");
  
  // Capitalize first letter
  return name.charAt(0).toUpperCase() + name.slice(1) + (path.includes(":") ? " endpoint" : "");
}

async function scanApiFiles(): Promise<ApiEndpoint[]> {
  const endpointsMap = new Map<string, ApiEndpoint>();
  const files = await readdir(apiDir);

  for (const file of files) {
    if (!file.endsWith(".ts") && !file.endsWith(".tsx")) continue;

    try {
      // Dynamic import of the API module
      const modulePath = join(apiDir, file);
      const module = await import(modulePath);

      // First, try to find metadata exports (e.g., helloMetadata, dashboardMetadata)
      // Check all exports for metadata
      const metadataMaps: Record<string, any>[] = [];
      for (const exportName in module) {
        if (exportName.endsWith("Metadata") && typeof module[exportName] === "object" && module[exportName] !== null) {
          metadataMaps.push(module[exportName]);
        }
      }

      // Then find route exports (e.g., hello, dashboard, test)
      for (const exportName in module) {
        const apiRoutes = module[exportName];

        // Skip if it's not an object or if it's metadata
        if (typeof apiRoutes !== "object" || apiRoutes === null || exportName.endsWith("Metadata")) continue;

        // Iterate over route paths
        for (const path in apiRoutes) {
          const routeHandler = apiRoutes[path];
          const methods = extractMethods(routeHandler);

          if (methods.length > 0) {
            // Check if we have metadata for this endpoint in any metadata map
            let metadata: any = undefined;
            for (const metadataMap of metadataMaps) {
              if (metadataMap[path]) {
                metadata = metadataMap[path];
                break;
              }
            }
            
            let methodDetails: MethodInfo[] | undefined;
            if (metadata?.methods && Array.isArray(metadata.methods)) {
              methodDetails = metadata.methods.map((m: any) => ({
                method: m.method,
                requestType: m.requestType,
                responseType: m.responseType,
                mockData: m.mockData,
                description: m.description,
              }));
            }

            endpointsMap.set(path, {
              path,
              methods,
              methodDetails,
              description: metadata?.description || generateDescription(path),
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }

  // Convert map to array and sort by path
  const endpoints = Array.from(endpointsMap.values());
  endpoints.sort((a, b) => a.path.localeCompare(b.path));

  return endpoints;
}

function generateConfigFile(endpoints: ApiEndpoint[]): string {
  const endpointStrings = endpoints.map((ep) => {
    const methodsStr = JSON.stringify(ep.methods).replace(/,/g, ", ");
    const descStr = ep.description ? `,\n    description: "${ep.description}"` : "";
    
    let methodDetailsStr = "";
    if (ep.methodDetails && ep.methodDetails.length > 0) {
      const methodDetailsJson = JSON.stringify(ep.methodDetails, null, 6)
        .split("\n")
        .map((line, idx) => (idx === 0 ? line : "      " + line))
        .join("\n");
      methodDetailsStr = `,\n    methodDetails: ${methodDetailsJson}`;
    }
    
    return `  {
    path: "${ep.path}",
    methods: ${methodsStr}${descStr}${methodDetailsStr}
  }`;
  }).join(",\n");

  return `/**
 * API Endpoints Registry
 * 
 * ⚠️ AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * This file is automatically generated from API files in src/api/
 * Run: bun run scripts/generate-api-endpoints.ts to regenerate
 */

export interface MethodInfo {
  method: string;
  requestType?: string;
  responseType?: string;
  mockData?: unknown;
  description?: string;
}

export interface ApiEndpoint {
  path: string;
  methods: string[];
  methodDetails?: MethodInfo[];
  description?: string;
}

export const API_ENDPOINTS: ApiEndpoint[] = [
${endpointStrings}
];

/**
 * Get endpoint by path
 */
export function getEndpointByPath(path: string): ApiEndpoint | undefined {
  return API_ENDPOINTS.find((ep) => ep.path === path);
}

/**
 * Get all unique HTTP methods across all endpoints
 */
export function getAllMethods(): string[] {
  const methods = new Set<string>();
  API_ENDPOINTS.forEach((ep) => {
    ep.methods.forEach((method) => methods.add(method));
  });
  return Array.from(methods).sort();
}

/**
 * Get method details for a specific endpoint and method
 */
export function getMethodDetails(path: string, method: string): MethodInfo | undefined {
  const endpoint = API_ENDPOINTS.find((ep) => ep.path === path);
  return endpoint?.methodDetails?.find((m) => m.method === method);
}

/**
 * Get mock data for a specific endpoint and method
 */
export function getMockData(path: string, method: string): unknown | undefined {
  const methodInfo = getMethodDetails(path, method);
  return methodInfo?.mockData;
}
`;
}

async function main() {
  console.log("🔍 Scanning API files...");
  const endpoints = await scanApiFiles();

  console.log(`✅ Found ${endpoints.length} endpoint(s):`);
  endpoints.forEach((ep) => {
    console.log(`   ${ep.methods.join(", ")} ${ep.path}`);
  });

  console.log("\n📝 Generating config file...");
  const configContent = generateConfigFile(endpoints);

  await Bun.write(outputFile, configContent);
  console.log(`\n✅ Generated ${outputFile}`);
}

main().catch(console.error);

