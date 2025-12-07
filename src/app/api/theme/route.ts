import { NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { withErrorHandling } from "@/lib/api-handler";

export const GET = withErrorHandling(async () => {
  const config = loadConfig();
  const themeConfig = config.theme || {};

  return NextResponse.json({
    theme: themeConfig,
  });
});






