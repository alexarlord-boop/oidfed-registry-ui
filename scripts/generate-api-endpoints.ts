// This script was used previously to generate `src/config/api-endpoints.ts` from
// server-side API descriptor files in `src/api/`.
//
// The repository no longer requires an automatic generator. If you need to
// reintroduce this workflow, restore the original script from version control
// or reimplement a generator that suits your needs.

console.log("generate-api-endpoints script is retired in this branch.");
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

