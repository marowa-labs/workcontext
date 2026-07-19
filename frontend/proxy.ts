import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "./app/lib/supabase/middleware";

// Define route patterns
const publicRoutes = [
  "/",
  "/features",
  "/pricing",
  "/contact",
  "/help",
  "/about",
  "/mobile",
  "/integrations",
  "/changelog",
  "/roadmap",
  "/schedule-demo",
  "/company",
  "/legal",
  "/solutions",
  "/resources",
  "/docs",
];

const authRoutes = [
  "/login",
  "/signup",
  "/forgot-password",
  "/verify-email",
  "/reset-password",
  "/auth/callback",
  "/post-checkout",
];

const protectedRoutes = ["/dashboard", "/settings"];

export async function proxy(request: NextRequest) {
  // Resolve the Supabase session from the auth cookies and refresh it.
  // `response` already carries any refreshed Set-Cookie headers.
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;
  const isAuthenticated = !!user;

  // Helper to forward refreshed auth cookies onto a redirect response.
  const redirectWithCookies = (url: URL) => {
    const redirect = NextResponse.redirect(url);
    for (const c of response.cookies.getAll()) {
      redirect.cookies.set(c.name, c.value, c.options);
    }
    return redirect;
  };

  // Check if route is public (allow access)
  const isPublicRoute = publicRoutes.some(
    (route) => pathname.startsWith(route) || pathname === route,
  );

  if (isPublicRoute) {
    return response;
  }

  // Check if route is auth-only (redirect if already authenticated)
  const isAuthRoute = authRoutes.some(
    (route) => pathname.startsWith(route) || pathname === route,
  );

  if (isAuthRoute) {
    if (isAuthenticated) {
      // User is already logged in, redirect to dashboard
      return redirectWithCookies(new URL("/dashboard", request.url));
    }
    return response;
  }

  // Check if route is protected (require authentication)
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtectedRoute) {
    if (!isAuthenticated) {
      // User is not authenticated, redirect to login
      const loginUrl = new URL("/login", request.url);
      // Save the original URL to redirect back after login
      loginUrl.searchParams.set("redirect", pathname);
      return redirectWithCookies(loginUrl);
    }
    return response;
  }

  // Default: allow access
  return response;
}

// Configure which routes use this proxy
export const proxyConfig = {
  matcher: [
    /*
     * Match all request paths except:
     * - _vercel (Vercel platform routes: insights, speed insights, etc.)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    "/((?!_vercel|_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
