import type { ApiContext } from "./apiContext";

const baseUrl = "http://127.0.0.1:4010"; // default to local Prism mock

export type ErrorWrapper<TError> =
  | TError
  | { status: "unknown"; payload: string };

export type ApiFetcherOptions<TBody, THeaders, TQueryParams, TPathParams> = {
  url: string;
  method: string;
  body?: TBody;
  headers?: THeaders;
  queryParams?: TQueryParams;
  pathParams?: TPathParams;
  signal?: AbortSignal;
} & ApiContext["fetcherOptions"];

export async function apiFetch<
  TData,
  TError,
  TBody extends {} | FormData | undefined | null,
  THeaders extends {},
  TQueryParams extends {},
  TPathParams extends {},
>({
  url,
  method,
  body,
  headers,
  pathParams,
  queryParams,
  signal,
}: ApiFetcherOptions<
  TBody,
  THeaders,
  TQueryParams,
  TPathParams
>): Promise<TData> {
  let error: ErrorWrapper<TError>;
  try {
    // New unified auth system integration
    let authHeaders: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Try to get auth headers from the unified auth system
    try {
      const { getAuthenticatedHeaders } = await import('../auth/components/AuthProvider');
      authHeaders = await getAuthenticatedHeaders();
    } catch (e) {
      // Fallback to legacy auth system for backwards compatibility
      try {
        let runtimeToken: string | undefined;
        let runtimeAccount: string | undefined;

        if (typeof window !== "undefined") {
          runtimeToken = window.localStorage.getItem("API_BEARER") ?? undefined;
          runtimeAccount = window.localStorage.getItem("API_ACCOUNT_USERNAME") ?? undefined;
        }

        // Check environment variables as fallback
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const envToken = (typeof import.meta !== "undefined" ? (import.meta as any).env?.VITE_API_BEARER : undefined) as string | undefined;
          if (!runtimeToken && envToken) runtimeToken = envToken;
        } catch (envError) {
          // ignore
        }

        authHeaders = {
          "Content-Type": "application/json",
          ...(runtimeAccount ? { ["X-Account-Username"]: runtimeAccount } : {}),
        };

        if (runtimeToken) {
          (authHeaders as Record<string, string>)["Authorization"] = `Bearer ${runtimeToken}`;
        }
      } catch (legacyError) {
        console.warn('Failed to get legacy auth headers:', legacyError);
      }
    }

    const requestHeaders: HeadersInit = {
      ...authHeaders,
      ...headers,
    };

    /**
     * As the fetch API is being used, when multipart/form-data is specified
     * the Content-Type header must be deleted so that the browser can set
     * the correct boundary.
     * https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects#sending_files_using_a_formdata_object
     */
    if (
      requestHeaders["Content-Type"]
        ?.toLowerCase()
        .includes("multipart/form-data")
    ) {
      delete requestHeaders["Content-Type"];
    }

    // allow overriding base url at runtime via localStorage (key: API_BASE_URL)
    let effectiveBase = baseUrl;
    try {
      if (typeof window !== "undefined") {
        const v = window.localStorage.getItem("API_BASE_URL");
        if (v) effectiveBase = v;
      }
    } catch (e) {}

    // debug: surface whether we are sending an Authorization header (mask token)
    try {
      const hasAuth = !!(requestHeaders as Record<string, string>)["Authorization"];
      // do not print token value
      // eslint-disable-next-line no-console
      console.debug("[apiFetch]", method.toUpperCase(), `${effectiveBase}${resolveUrl(url, queryParams, pathParams)}`, {
        authorizationPresent: hasAuth,
        account: (requestHeaders as Record<string, string>)["X-Account-Username"],
        base: effectiveBase,
      });
    } catch (e) {
      // ignore logging errors
    }

    const response = await window.fetch(
      `${effectiveBase}${resolveUrl(url, queryParams, pathParams)}`,
      {
        signal,
        method: method.toUpperCase(),
        body: body
          ? body instanceof FormData
            ? body
            : JSON.stringify(body)
          : undefined,
        headers: requestHeaders,
      },
    );
    if (!response.ok) {
      try {
        error = await response.json();
      } catch (e) {
        error = {
          status: "unknown" as const,
          payload:
            e instanceof Error
              ? `Unexpected error (${e.message})`
              : "Unexpected error",
        };
      }
    } else if (response.headers.get("content-type")?.includes("json")) {
      return await response.json();
    } else {
      // if it is not a json response, assume it is a blob and cast it to TData
      return (await response.blob()) as unknown as TData;
    }
  } catch (e) {
    const errorObject: Error = {
      name: "unknown" as const,
      message:
        e instanceof Error ? `Network error (${e.message})` : "Network error",
      stack: e as string,
    };
    throw errorObject;
  }
  throw error;
}

const resolveUrl = (
  url: string,
  queryParams: Record<string, string> = {},
  pathParams: Record<string, string> = {},
) => {
  let query = new URLSearchParams(queryParams).toString();
  if (query) query = `?${query}`;
  return (
    url.replace(/\{\w*\}/g, (key) => pathParams[key.slice(1, -1)] ?? "") + query
  );
};
