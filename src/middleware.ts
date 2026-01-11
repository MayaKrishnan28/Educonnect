
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/auth'

export async function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get('session')?.value
    let user = null

    if (sessionCookie) {
        try {
            user = await decrypt(sessionCookie)
        } catch (e) {
            // Invalid session
        }
    }

    const path = request.nextUrl.pathname
    const isDashboard = path.startsWith('/dashboard')
    const isStaffPath = path.startsWith('/staff')
    const isAuthPage = path.startsWith('/login') || path === '/' || path.startsWith('/about') || path.startsWith('/register')

    // 1. If Not Logged In
    if ((isDashboard || isStaffPath) && !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // 2. If Logged In: Redirect away from Auth pages
    if (isAuthPage && user) {
        if (user.role === 'STAFF') {
            return NextResponse.redirect(new URL('/staff', request.url))
        } else {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    // 3. Role-Based Access Control
    // Prevent Student from accessing /staff
    if (isStaffPath && user && user.role !== 'STAFF') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Prevent Staff from accessing the generic Student Dashboard (Home)
    // But ALLOW them to access sub-resources like /dashboard/classes (Shared components)
    if (path === '/dashboard' && user && user.role === 'STAFF') {
        return NextResponse.redirect(new URL('/staff', request.url))
    }

    // 4. Create Response
    const response = NextResponse.next()

    // 5. Force No-Cache for Protected Routes
    if (isDashboard || isStaffPath) {
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')
        response.headers.set('Surrogate-Control', 'no-store')
    }

    return response
}

export const config = {
    matcher: ['/dashboard/:path*', '/staff/:path*', '/login', '/', '/about', '/register'],
}
