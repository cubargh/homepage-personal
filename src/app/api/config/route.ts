import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";
import { loadConfig } from "@/lib/config";
import { withErrorHandling } from "@/lib/api-handler";
import { ApiError, ApiErrorCode } from "@/lib/api-error";
import yaml from "js-yaml";
import fs from "fs";
import path from "path";
import { AppConfig } from "@/lib/config";

// Helper function to verify authentication
async function verifyAuth(request: NextRequest): Promise<boolean> {
  // Check if authentication is enabled
  try {
    const config = loadConfig();
    // If auth.enabled is explicitly false, allow access
    if (config.server.auth.enabled === false) {
      return true;
    }
    // If auth.enabled is not set, default to true for backward compatibility
  } catch (error) {
    // If config fails to load, default to requiring auth for security
    console.error("Failed to load config in verifyAuth:", error);
  }

  const cookie = request.cookies.get("session");
  if (!cookie?.value) {
    return false;
  }

  const session = await decrypt(cookie.value);
  return session !== null && session.authenticated === true;
}

// Get config file path
function getConfigPath(): string {
  return process.env.CONFIG_FILE || path.join(process.cwd(), "config.yaml");
}

// GET - Read config file
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Verify authentication
  if (!(await verifyAuth(request))) {
    throw new ApiError("Unauthorized", 401, ApiErrorCode.UNAUTHORIZED);
  }

  const configPath = getConfigPath();

  // Check if config file exists
  if (!fs.existsSync(configPath)) {
    // Try to read example file as fallback
    const examplePath = path.join(process.cwd(), "config.example.yaml");
    if (fs.existsSync(examplePath)) {
      const fileContents = fs.readFileSync(examplePath, "utf8");
      return NextResponse.json({
        content: fileContents,
        path: examplePath,
        isExample: true,
      });
    }
    throw new ApiError("Config file not found", 404, ApiErrorCode.NOT_FOUND);
  }

  const fileContents = fs.readFileSync(configPath, "utf8");

  return NextResponse.json({
    content: fileContents,
    path: configPath,
    isExample: false,
  });
});

// POST - Write config file
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Verify authentication
  if (!(await verifyAuth(request))) {
    throw new ApiError("Unauthorized", 401, ApiErrorCode.UNAUTHORIZED);
  }

  let body: { content?: unknown };
  try {
    body = await request.json();
  } catch {
    throw new ApiError(
      "Invalid request body",
      400,
      ApiErrorCode.VALIDATION_ERROR
    );
  }

  const { content } = body;

  if (!content || typeof content !== "string") {
    throw new ApiError("Content is required", 400, ApiErrorCode.VALIDATION_ERROR);
  }

  // Validate YAML syntax
  try {
    const parsed = yaml.load(content) as AppConfig;

    // Basic validation - check required fields
    if (!parsed.server || !parsed.widgets) {
      throw new Error("Invalid config structure: missing server or widgets");
    }

    if (!parsed.server.root_domain || !parsed.server.timezone) {
      throw new Error("Invalid config structure: missing required server fields");
    }
  } catch (yamlError) {
    const errorMessage =
      yamlError instanceof Error ? yamlError.message : String(yamlError);
    throw new ApiError(
      "Invalid YAML syntax or structure",
      400,
      ApiErrorCode.VALIDATION_ERROR,
      errorMessage
    );
  }

  const configPath = getConfigPath();

  // Create backup before writing
  if (fs.existsSync(configPath)) {
    try {
      const backupPath = `${configPath}.backup.${Date.now()}`;
      fs.copyFileSync(configPath, backupPath);
    } catch (backupError) {
      // Log backup error but continue with save
      console.warn("Failed to create backup:", backupError);
    }
  }

  // Write new config
  fs.writeFileSync(configPath, content, "utf8");

  return NextResponse.json({
    success: true,
    message: "Config saved successfully",
  });
});

