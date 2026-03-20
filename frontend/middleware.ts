import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup"];

/** Decode the JWT exp claim and check if the token is expired. */
function isTokenExpired(token: string): boolean {
    try {
        const payloadBase64 = token.split(".")[1];
        // Next.js middleware runs on the Edge runtime — use atob
        const payload = JSON.parse(atob(payloadBase64));
        const exp: number = payload.exp;
        if (!exp) return true;
        // exp is in seconds; Date.now() is in milliseconds
        return Date.now() >= exp * 1000;
    } catch {
        return true; // malformed token → treat as expired
    }
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
    const token = request.cookies.get("access_token")?.value;

    const isExpired = !token || isTokenExpired(token);

    // Unauthenticated or expired — clear cookie and send to /login
    if (!isPublic && isExpired) {
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("access_token");
        response.cookies.delete("refresh_token");
        return response;
    }

    // Logged-in user hitting /login or /signup — send to dashboard
    if (isPublic && token && !isTokenExpired(token)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next|public|favicon.ico|api).*)"],
};
