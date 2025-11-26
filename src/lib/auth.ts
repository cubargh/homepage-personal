import { SignJWT, jwtVerify } from "jose";

// Define your session payload type
export interface SessionPayload {
  user: string;
  expires: Date;
  [key: string]: unknown; // Allow extensibility
}

const secretKey = process.env.AUTH_PASSPHRASE;
if (!secretKey) {
  // Only log this warning in development or if explicitly checked
  if (process.env.NODE_ENV === 'development') {
    console.warn("⚠️  AUTH_PASSPHRASE is not set. Using insecure default key.");
  }
}

const key = new TextEncoder().encode(secretKey || "default-insecure-secret");

export async function encrypt(payload: SessionPayload) {
  const days = parseInt(process.env.AUTH_SESSION_DAYS || "7", 10);
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
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


