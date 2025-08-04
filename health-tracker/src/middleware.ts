import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth-edge"

export default async function middleware(request: NextRequest) {
  // Don't check auth for these paths
  const publicPaths = ["/", "/login", "/error", "/api/auth"]
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + "/")
  )
  
  if (isPublicPath) {
    return NextResponse.next()
  }

  // For protected routes, check if user is authenticated
  const response = NextResponse.next()
  
  // Try to get session, but don't block if it fails
  try {
    const session = await auth()
    if (!session?.user) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL("/login", request.url))
    }
  } catch (error) {
    // If auth check fails in middleware, let the request through
    // The actual route will handle authentication
    console.error("Middleware auth check failed:", error)
  }
  
  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)"],
}