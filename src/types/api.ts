/**
 * API Types
 * 
 * Centralized type definitions for API endpoints
 */

// Helper type to extract JSON response type
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

// Base API response structure
export interface ApiResponse<T = unknown> {
  message?: string;
  data?: T;
  error?: string;
}

// Example types for hello endpoint
export interface HelloResponse {
  message: string;
  method: string;
}

export interface HelloNameResponse {
  message: string;
}

export interface HelloRequest {
  name?: string;
}

// Example types for dashboard endpoint
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  lastUpdated: string;
}

export interface DashboardStatsResponse extends ApiResponse<DashboardStats> {}

// Example types for test endpoint
export interface TestResponse {
  message: string;
  method: string;
}

export interface TestNameResponse {
  message: string;
}

export interface TestRequest {
  name?: string;
  data?: Record<string, unknown>;
}

