import jwt from "jsonwebtoken";

const SIGN_OPTIONS: jwt.SignOptions = {
  expiresIn: "8h",
  algorithm: "HS256",
};
const VERIFY_OPTIONS: jwt.VerifyOptions = {
  algorithms: ["HS256"],
};

const PLACEHOLDERS = new Set([
  "change_me",
  "changeme",
  "secret",
  "jwt_secret",
  "replace-me",
]);

export interface UserPayload {
  id: string;
  email: string;
  role: string;
}

function readSecret(): string | null {
  const secret = process.env.JWT_SECRET?.trim() ?? "";
  if (secret.length < 24 || PLACEHOLDERS.has(secret.toLowerCase()) || secret.toUpperCase().includes("CHANGE_ME")) {
    return null;
  }
  return secret;
}

export function signToken(payload: UserPayload): string {
  const secret = readSecret();
  if (!secret) {
    throw new Error("JWT_SECRET falta o sigue siendo un marcador.");
  }
  return jwt.sign(
    { id: payload.id, email: payload.email, role: payload.role },
    secret,
    SIGN_OPTIONS
  );
}

export function verifyToken(token: string): UserPayload | null {
  const secret = readSecret();
  if (!secret) return null;
  try {
    const decoded = jwt.verify(token, secret, VERIFY_OPTIONS) as jwt.JwtPayload;
    if (
      typeof decoded !== "object" ||
      typeof decoded.id !== "string" ||
      typeof decoded.email !== "string" ||
      typeof decoded.role !== "string"
    ) {
      return null;
    }
    return { id: decoded.id, email: decoded.email, role: decoded.role };
  } catch {
    return null;
  }
}
