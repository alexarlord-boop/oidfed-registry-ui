import {
  generateSchemaTypes,
  generateReactQueryComponents,
} from "@openapi-codegen/typescript";
import { defineConfig } from "@openapi-codegen/cli";
export default defineConfig({
  api: {
    from: {
      source: "url",
      url: "https://gitlab.software.geant.org/TI_Incubator/federation-admin-api/-/raw/29d973f4e8fb8b6c2826e09b2b70b0cd8aadb772/federation_admin_openapi.yaml",
    },
    outputDir: "generated/api",
    to: async (context) => {
      const filenamePrefix = "api";
      const { schemasFiles } = await generateSchemaTypes(context, {
        filenamePrefix,
      });
      await generateReactQueryComponents(context, {
        filenamePrefix,
        schemasFiles,
      });
    },
  },
});
