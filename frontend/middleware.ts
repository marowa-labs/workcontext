import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get authentication token from cookies
  const token =
    request.cookies.get("sb-access-token")?.value ||
    request.cookies.get("supabase-auth-token")?.value;

  const isAuthenticated = !!token;

  // Check if route is public (allow access)
  const isPublicRoute = publicRoutes.some(
    (route) => pathname.startsWith(route) || pathname === route,
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if route is auth-only (redirect if already authenticated)
  const isAuthRoute = authRoutes.some(
    (route) => pathname.startsWith(route) || pathname === route,
  );

  if (isAuthRoute) {
    if (isAuthenticated) {
      // User is already logged in, redirect to dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
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
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Default: allow access
  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    "/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
