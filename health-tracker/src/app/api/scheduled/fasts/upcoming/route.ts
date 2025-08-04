import { NextResponse } from "next/server"

export async function GET() {
  // Return empty array for now to prevent 404 errors
  return NextResponse.json([])
}