import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";
import yaml from "js-yaml";
import fs from "fs";
import path from "path";
import { AppConfig } from "@/lib/config";

// Helper function to verify authentication
async function verifyAuth(request: NextRequest): Promise<boolean> {
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
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    if (!(await verifyAuth(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
          isExample: true
        });
      }
      return NextResponse.json(
        { error: "Config file not found" },
        { status: 404 }
      );
    }

    const fileContents = fs.readFileSync(configPath, "utf8");
    
    return NextResponse.json({
      content: fileContents,
      path: configPath,
      isExample: false
    });
  } catch (error) {
    console.error("Error reading config:", error);
    return NextResponse.json(
      { error: "Failed to read config file" },
      { status: 500 }
    );
  }
}

// POST - Write config file
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    if (!(await verifyAuth(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
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
      const errorMessage = yamlError instanceof Error 
        ? yamlError.message 
        : String(yamlError);
      return NextResponse.json(
        { 
          error: "Invalid YAML syntax or structure",
          details: errorMessage
        },
        { status: 400 }
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
      message: "Config saved successfully"
    });
  } catch (error) {
    console.error("Error writing config:", error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Unknown error occurred";
    return NextResponse.json(
      { error: "Failed to write config file", details: errorMessage },
      { status: 500 }
    );
  }
}

