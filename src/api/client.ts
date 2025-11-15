/**
 * API client wrapper that configures the generated OpenAPI client
 * This file provides clean access to generated API without modifications
 */

// Set up environment configuration
import './environment';

// Re-export all generated hooks and types
export * from '../../generated/api/apiComponents';
export * from '../../generated/api/apiContext';

// Export types for convenience
export type * from '../../generated/api/apiSchemas';
export type * from '../../generated/api/apiResponses';
export type * from '../../generated/api/apiParameters';