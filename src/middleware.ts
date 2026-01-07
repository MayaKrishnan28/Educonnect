
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const session = request.cookies.get('session')?.value

    // 1. Define Protected Routes
    const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
    const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/about')

    // 2. Auth Logic
    if (isDashboard && !session) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Optional: Redirect logged-in users away from login?
    // if (isAuthPage && session) {
    //   return NextResponse.redirect(new URL('/dashboard', request.url))
    // }

    // 3. Create Response
    const response = NextResponse.next()

    // 4. Force No-Cache for Protected Routes
    // This fixes the "Back Button" issue by telling the browser NEVER to cache these pages
    if (isDashboard) {
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')
        response.headers.set('Surrogate-Control', 'no-store')
    }

    return response
}

export const config = {
    matcher: ['/dashboard/:path*', '/login', '/'],
}
