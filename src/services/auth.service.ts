/**
 * Auth service – login flow using jose JWT + PBKDF2 password verification.
 */

import { SignJWT } from "jose";
import type { DrizzleDb } from "../repositories/db";
import * as userRepo from "../repositories/user.repository";
import { verifyPassword } from "../utils/crypto";
import { UnauthorizedError } from "../utils/errors";
import type { LoginBody } from "../validators/auth.validators";
import type { Bindings } from "../types/bindings";

/** 24-hour JWT expiry. */
const JWT_EXPIRY = "24h";

export type LoginResponseDto = {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
};

/**
 * Verify credentials and return a signed JWT + sanitised user object.
 * Throws UnauthorizedError (401) for any authentication failure
 * (deliberately vague to prevent user-enumeration attacks).
 */
export async function login(
  db: DrizzleDb,
  env: Bindings,
  body: LoginBody
): Promise<LoginResponseDto> {
  // 1. Find user (normalise email to lowercase)
  const user = await userRepo.findUserByEmail(db, body.email);

  // 2. Gate: user must exist with a password hash set
  if (!user || !user.passwordHash) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // 3. Constant-time password verification (PBKDF2)
  const valid = await verifyPassword(body.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // 4. Sign JWT
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(secret);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}
