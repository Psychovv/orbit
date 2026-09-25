import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET ?? 'dev-secret-change-me')
const COOKIE_NAME = 'orbit-session'

const PUBLIC_PATHS = ['/login', '/api/auth']

function unauthorized(request: NextRequest, clearCookie = false) {
  const isApi = request.nextUrl.pathname.startsWith('/api/')
  if (isApi) {
    const response = NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    if (clearCookie) response.cookies.delete(COOKIE_NAME)
    return response
  }

  const response = NextResponse.redirect(new URL('/login', request.url))
  if (clearCookie) response.cookies.delete(COOKIE_NAME)
  return response
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }
  
  // Check session cookie
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    return unauthorized(request)
  }
  
  try {
    await jwtVerify(token, SECRET)
    return NextResponse.next()
  } catch {
    return unauthorized(request, true)
  }
}

export const config = {
  matcher: [
    // Match all paths except static files and images
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.png$).*)',
  ],
}
