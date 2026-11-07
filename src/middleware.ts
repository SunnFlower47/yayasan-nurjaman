import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

function buildCspHeader(nonce: string, isDev: boolean): string {
  const scriptDirectives = [
    "'self'",
    `'nonce-${nonce}'`,
    isDev ? "'unsafe-eval'" : "",
    isDev ? "'unsafe-inline'" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const directives = [
    "default-src 'self'",
    `script-src ${scriptDirectives}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "block-all-mixed-content",
    "upgrade-insecure-requests",
  ];

  return directives.join("; ");
}

function applySecurityHeaders(
  response: NextResponse,
  request: NextRequest,
  nonce: string,
  requestId: string
): void {
  const isDev = process.env.NODE_ENV === "development";
  const csp = buildCspHeader(nonce, isDev);

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()"
  );
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("x-request-id", requestId);

  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/ganti-password") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/dev")
  ) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
}

export function middleware(request: NextRequest) {
  const nonce = generateNonce();
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const pathname = request.nextUrl.pathname;
  const isProd = process.env.NODE_ENV === "production";
  const cookieName = isProd ? "__Host-session" : "session";
  const hasSessionCookie = Boolean(request.cookies.get(cookieName)?.value);

  // Pengalihan UX Berdasarkan Keberadaan Cookie Sesi (ADR-004)
  if (
    !hasSessionCookie &&
    (pathname.startsWith("/admin") || pathname.startsWith("/ganti-password"))
  ) {
    const loginUrl = new URL("/masuk", request.url);
    loginUrl.searchParams.set("next", pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    applySecurityHeaders(redirectResponse, request, nonce, requestId);
    return redirectResponse;
  }

  if (hasSessionCookie && pathname === "/masuk") {
    const adminUrl = new URL("/admin", request.url);
    const redirectResponse = NextResponse.redirect(adminUrl);
    applySecurityHeaders(redirectResponse, request, nonce, requestId);
    return redirectResponse;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  applySecurityHeaders(response, request, nonce, requestId);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|brand/|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
