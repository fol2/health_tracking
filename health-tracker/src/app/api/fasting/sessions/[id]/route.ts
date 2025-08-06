import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { FastingService } from '@/lib/services/fasting.service'
import { errorResponse, handleApiError, successResponse } from '@/lib/api-utils'
import { z } from 'zod'

// Validation schema with custom refinement
const updateSessionSchema = z.object({
  startTime: z.string().datetime().refine(
    (date) => new Date(date) <= new Date(),
    { message: 'Start time cannot be in the future' }
  ),
})

// PATCH /api/fasting/sessions/[id] - Update a fasting session
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const session = await getServerSession()
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', 401)
    }

    // Parse and validate request
    const { id } = await context.params
    const body = await request.json()
    const { startTime } = updateSessionSchema.parse(body)
    
    // Update session
    const updatedSession = await FastingService.updateSessionStartTime(
      id,
      session.user.id,
      new Date(startTime)
    )
    
    if (!updatedSession) {
      return errorResponse('Session not found or unauthorized', 404)
    }
    
    return successResponse(updatedSession)
  } catch (error) {
    return handleApiError(error)
  }
}