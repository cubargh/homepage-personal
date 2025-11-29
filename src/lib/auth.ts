import { SignJWT, jwtVerify } from "jose";
import { loadConfig } from "@/lib/config";

// Define your session payload type
export interface SessionPayload {
  user: string;
  expires: Date;
  [key: string]: unknown; // Allow extensibility
}

// We lazily load the key to avoid issues if config isn't ready at module load time (though it should be)
// or we can load it once. 
// Given Next.js server environment, let's load it.

let key: Uint8Array;
let sessionDays = 7;

try {
    const config = loadConfig();
    const secretKey = config.server.auth.passphrase;
    sessionDays = config.server.auth.session_days || 7;

    if (!secretKey) {
      if (process.env.NODE_ENV === 'development') {
        console.warn("⚠️  auth.passphrase is not set. Using insecure default key.");
      }
    }
    key = new TextEncoder().encode(secretKey || "default-insecure-secret");
} catch (error) {
    // If config fails to load, use default insecure key but log error
    console.error("Failed to load auth config:", error);
    key = new TextEncoder().encode("default-insecure-secret");
}

export async function encrypt(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${sessionDays}d`)
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload as SessionPayload;
  } catch (error) {
    return null;
  }
}
