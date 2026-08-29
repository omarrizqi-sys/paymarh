import type { ApiResponse, ApiWarning } from '@paymarh/shared-types';

export function ok<T>(data: T, warnings: readonly ApiWarning[] = []): ApiResponse<T> {
  return { data, warnings };
}
