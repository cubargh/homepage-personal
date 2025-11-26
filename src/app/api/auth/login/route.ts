import { NextRequest, NextResponse } from "next/server";
import { encrypt } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { passphrase } = body;

    const envPassphrase = process.env.AUTH_PASSPHRASE;

    if (passphrase !== envPassphrase) {
      return NextResponse.json({ error: "Invalid passphrase" }, { status: 401 });
    }

    const days = parseInt(process.env.AUTH_SESSION_DAYS || "7", 10);
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // Create session
    const session = await encrypt({ 
      user: "admin", 
      expires, 
      authenticated: true 
    });

    const response = NextResponse.json({ success: true });
    
    response.cookies.set("session", session, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


