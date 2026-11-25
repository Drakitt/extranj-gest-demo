import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

/**
 * Hash scrypt.
 * Una longitud distinta devuelve falso en lugar de lanzar una excepción.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;

  const derivedKey = scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, "hex");
  if (keyBuffer.length !== derivedKey.length) return false;

  return timingSafeEqual(keyBuffer, derivedKey);
}
