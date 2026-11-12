import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_PATHS = ["/login", "/register", "/forgot-password"];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  const token = request.cookies.get("access_token")?.value;

  // If the user has a valid token cookie and tries to visit /login → send to dashboard,
  // UNLESS they explicitly requested the citizen/consumer portal:
  if (isAuthPage && token && token !== "null" && token !== "undefined") {
    const isCitizenRequest =
      searchParams.get("portal") === "citizen" ||
      searchParams.get("portal") === "consumer";
    if (isCitizenRequest) {
      return NextResponse.redirect(new URL("/citizen-portal", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // All other navigation: let it through.
  // The client-side AuthGuard in the dashboard layout handles protection,
  // which avoids cookie/SameSite/iframe issues with server-side redirects.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons|images).*)"],
};
