import { NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";

export async function GET() {
  try {
    const config = loadConfig();
    const themeConfig = config.theme || {};

    return NextResponse.json({
      theme: themeConfig,
    });
  } catch (error) {
    console.error("Failed to load theme config:", error);
    return NextResponse.json(
      { error: "Failed to load theme config" },
      { status: 500 }
    );
  }
}




