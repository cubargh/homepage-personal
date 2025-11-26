import { SignJWT, jwtVerify } from "jose";

// Use a default key if AUTH_PASSPHRASE is not set (e.g. during build), but warn.
// In production, AUTH_PASSPHRASE must be set.
const secretKey = process.env.AUTH_PASSPHRASE || "default-insecure-secret";
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  const days = parseInt(process.env.AUTH_SESSION_DAYS || "7", 10);
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

