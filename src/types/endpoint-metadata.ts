/**
 * Endpoint Metadata Types
 * 
 * Types for defining API endpoint metadata including types and mock data
 */

export interface EndpointMetadata {
  path: string;
  methods: MethodMetadata[];
  description?: string;
}

export interface MethodMetadata {
  method: string;
  requestType?: string;
  responseType?: string;
  mockData?: unknown;
  description?: string;
}

/**
 * Helper to define endpoint metadata
 */
export function defineEndpoint(metadata: EndpointMetadata): EndpointMetadata {
  return metadata;
}

