// Redirect to POST /api/fasting/sessions
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // This route exists for backwards compatibility
  // Redirect to the new endpoint
  return NextResponse.redirect(new URL('/api/fasting/sessions', request.url))
}