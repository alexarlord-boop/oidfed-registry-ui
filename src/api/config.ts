import type { ApiContext } from "../../generated/api/apiContext";

/**
 * API configuration - provides custom context for the generated API client
 * No path mapping needed since the generated API now has correct paths!
 */

/**
 * Custom API context for additional configuration
 */
export function useApiContext<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends readonly unknown[] = readonly unknown[],
>(): ApiContext<TQueryFnData, TError, TData, TQueryKey> {
  return {
    fetcherOptions: {
      // Custom headers or query params can go here
    },
    queryOptions: {
      // React Query options can go here
    },
  };
}