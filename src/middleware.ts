import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/server/auth/jwt";

const PROTECTED_PATHS = [
  "/report",
  "/collect",
  "/rewards",
  "/settings",
  "/messages",
  "/sell",
  "/admin",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only check protected paths
  const isProtected = PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get("recopoint_session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/report/:path*",
    "/collect/:path*",
    "/rewards/:path*",
    "/settings/:path*",
    "/messages/:path*",
    "/sell/:path*",
    "/admin/:path*",
  ],
};
