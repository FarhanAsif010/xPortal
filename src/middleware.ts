/**
 * middleware.ts — runs on the Edge Runtime.
 *
 * IMPORTANT: Only import from auth-edge.ts here, never from auth.ts.
 * auth.ts imports Prisma which is Node.js-only and will crash the edge runtime.
 */
import { edgeAuth } from "@/lib/auth-edge";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/dashboard", "/admin"];
const ADMIN_ONLY_ROUTES = ["/admin"];
const AUTH_ROUTES = ["/login"];

export default edgeAuth(async function middleware(req: NextRequest) {
  // edgeAuth wraps the request and injects `req.auth`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = (req as any).auth;
  const { pathname } = req.nextUrl;

  const isAuthenticated = !!session?.user?.id;
  const isActive = session?.user?.isActive === true;
  const role = session?.user?.role as string | undefined;

  // ── Redirect logged-in active users away from /login ───────────────────────
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    if (isAuthenticated && isActive) {
      const destination =
        role === "SUPER_ADMIN" ? "/admin/dashboard" : "/dashboard";
      return NextResponse.redirect(new URL(destination, req.url));
    }
    return NextResponse.next();
  }

  // ── Protect all authenticated routes ──────────────────────────────────────
  const requiresAuth = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  if (requiresAuth) {
    if (!isAuthenticated || !isActive) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Admin-only routes
    const requiresAdmin = ADMIN_ONLY_ROUTES.some((r) =>
      pathname.startsWith(r)
    );
    if (requiresAdmin && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Teller without a branch — hold on /no-branch
    if (role === "TELLER" && !session?.user?.branchId) {
      if (!pathname.startsWith("/no-branch")) {
        return NextResponse.redirect(new URL("/no-branch", req.url));
      }
    }
  }

  // ── API route protection ───────────────────────────────────────────────────
  if (pathname.startsWith("/api/admin")) {
    if (!isAuthenticated || !isActive || role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized", code: "ADMIN_ONLY" },
        { status: 403 }
      );
    }
  }

  if (
    pathname.startsWith("/api/teller") ||
    pathname.startsWith("/api/transactions")
  ) {
    if (!isAuthenticated || !isActive) {
      return NextResponse.json(
        { error: "Unauthorized", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
