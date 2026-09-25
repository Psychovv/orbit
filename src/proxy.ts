import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET ?? 'dev-secret-change-me')
const COOKIE_NAME = 'orbit-session'

const PUBLIC_PATHS = ['/login', '/api/auth']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }
  
  // Check session cookie
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  try {
    await jwtVerify(token, SECRET)
    return NextResponse.next()
  } catch {
    // Invalid/expired token
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete(COOKIE_NAME)
    return response
  }
}

export const config = {
  matcher: [
    // Match all paths except static files and images
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.png$).*)',
  ],
}
