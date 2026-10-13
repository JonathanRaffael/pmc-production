import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = process.env.AUTH_SECRET;

if (!secret) {
  throw new Error("AUTH_SECRET is not defined");
}

const secretKey = new TextEncoder().encode(secret);

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("pmc_session")?.value;

  const { pathname } = request.nextUrl;

  // Belum login
  if (!token) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  try {
    const { payload } = await jwtVerify(token, secretKey);

    const role = payload.role;

    // USER mencoba masuk ADMIN
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(
        new URL("/dashboard", request.url)
      );
    }

    // ADMIN dan USER boleh dashboard
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};