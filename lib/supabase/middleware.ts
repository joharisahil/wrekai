import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Use getUser() instead of getSession() for security
  // getUser() validates the token with Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup')
  const isProtectedDashboardRoute = pathname.startsWith('/dashboard')
  const isProtectedOnboardingRoute = pathname.startsWith('/onboarding')
  const isOnboardingApiRoute = pathname.startsWith('/api/slack/')
  const isPublicRoute =
    pathname === '/' ||
    isAuthRoute ||
    pathname.startsWith('/api/auth/callback')

  if (!user && (isProtectedDashboardRoute || isProtectedOnboardingRoute)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('message', 'Sign in to access your Clareeva dashboard.')
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (user && !isProtectedOnboardingRoute && !isOnboardingApiRoute) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', profileError.message)
      return NextResponse.redirect(url)
    }

    if (!profile?.onboarding_completed) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  }

  if (!isPublicRoute && !isProtectedDashboardRoute && !isProtectedOnboardingRoute) {
    return supabaseResponse
  }

  return supabaseResponse
}
