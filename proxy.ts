import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || 'localhost:3000'

  // Refresh Supabase auth session
  let supabaseResponse = NextResponse.next({
    request,
  })

  // We only initialize Supabase if we have env vars ready
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )
    
    // Evaluate auth
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    const isAuthRoute = url.pathname.startsWith('/login') || url.pathname.startsWith('/auth')
    const isAdminHost = hostname === 'app.foxgrade.com' || (hostname.includes('localhost') && url.pathname.startsWith('/admin'))

    if (isAdminHost && !isAuthRoute && !user) {
      // Must be authenticated to view admin
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      return NextResponse.redirect(loginUrl)
    }

    if (isAuthRoute && user) {
      // If logged in, don't show login
      const homeUrl = request.nextUrl.clone()
      homeUrl.pathname = '/admin'
      return NextResponse.redirect(homeUrl)
    }
  }

  // 1. Localhost fallback
  if (hostname.includes('localhost') && url.pathname.startsWith('/trust/')) {
    return supabaseResponse
  }

  // 2. Production hostnames
  if (hostname === 'foxgrade.com' || hostname === 'www.foxgrade.com') {
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL('/marketing', request.url))
    }
    return supabaseResponse
  }

  if (hostname === 'app.foxgrade.com') {
    if (url.pathname === '/') {
      return NextResponse.rewrite(new URL('/admin', request.url))
    }
    if (!url.pathname.startsWith('/admin') && !url.pathname.startsWith('/login') && !url.pathname.startsWith('/auth')) {
      return NextResponse.rewrite(new URL(`/admin${url.pathname}`, request.url))
    }
    return supabaseResponse
  }

  // 3. Wildcard Subdomains (*.foxgrade.com)
  if (hostname.endsWith('.foxgrade.com')) {
    const subdomain = hostname.replace('.foxgrade.com', '')
    return NextResponse.rewrite(new URL(`/${subdomain}${url.pathname}`, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
