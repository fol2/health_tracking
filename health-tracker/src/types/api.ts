/**
 * Common API response types
 */

export interface ApiError {
  error: string
  details?: any
}

export interface ApiSuccess<T = any> {
  data: T
  message?: string
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError

/**
 * Type guard to check if response is an error
 */
export function isApiError(response: ApiResponse): response is ApiError {
  return 'error' in response
}