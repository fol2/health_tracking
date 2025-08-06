import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Create a standardized error response
 */
export function errorResponse(
  message: string,
  status: number,
  details?: any
): NextResponse {
  return NextResponse.json(
    { 
      error: message, 
      ...(details && { details }) 
    },
    { status }
  )
}

/**
 * Handle common API errors with appropriate responses
 */
export function handleApiError(error: unknown): NextResponse {
  // Zod validation errors
  if (error instanceof z.ZodError) {
    return errorResponse('Invalid request data', 400, error.flatten())
  }
  
  // Generic errors
  console.error('API error:', error)
  
  const message = error instanceof Error 
    ? error.message 
    : 'An unexpected error occurred'
    
  return errorResponse(message, 500)
}

/**
 * Create a success response
 */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}