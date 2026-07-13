import crypto from "crypto";
import httpStatus from "http-status";
import config from "../../../config";
import ApiError from "../../../errors/apiError";
import prisma from "../../../lib/prisma";
import {
  acquireLock,
  blacklistToken,
  isTokenBlacklisted,
  releaseLock,
} from "../../../lib/redisConnection";
import { compareItem, hashItem, hashToken } from "../../../utils/hashAndCompareItem";
import { ITokenPayload, jwtHelpers } from "../../../utils/jwtHelpers";
import { ILoginInput, IRefreshTokenInput, IUser } from "./auth.interface";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface RefreshTokenMeta {
  userAgent?: string;
  ip?: string;
  familyId?: string;
}

const saveRefreshToken = async (userId: string, token: string, meta: RefreshTokenMeta = {}) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const tokenHash = hashToken(token);
  const jti = crypto.randomUUID();
  const familyId = meta.familyId ?? crypto.randomUUID();

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      jti,
      familyId,
      expiresAt,
      userAgent: meta.userAgent,
      ip: meta.ip,
    },
  });
};

// ---------------------------------------------------------------------------
// Service methods
// ---------------------------------------------------------------------------

const register = async (userData: IUser) => {
  const email = userData.email.toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email },
  });
  if (existing) {
    throw new ApiError(httpStatus.CONFLICT, "Email is already registered.");
  }

  const hashedPassword = await hashItem(userData.password);

  const user = await prisma.user.create({
    data: {
      email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      passwordHash: hashedPassword,
    },
    select: { id: true, firstName: true, lastName: true, email: true },
  });

  return user;
};

const login = async (loginData: ILoginInput, meta: RefreshTokenMeta = {}) => {
  const email = loginData.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid email or password.");
  }

  if (!user.isActive) {
    throw new ApiError(httpStatus.FORBIDDEN, "Your account has been deactivated.");
  }

  const isPasswordValid = await compareItem(loginData.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid email or password.");
  }

  const payload: ITokenPayload = {
    userId: user.id,
    email: user.email,
  };

  const { accessToken, refreshToken } = jwtHelpers.generateAuthTokens(payload);

  await saveRefreshToken(user.id, refreshToken, {
    userAgent: meta.userAgent,
    ip: meta.ip,
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
  };
};

const refreshAccessToken = async ({ refreshToken, userAgent, ip }: IRefreshTokenInput) => {
  const tokenHash = hashToken(refreshToken);

  // ------------------------------------------------------------------
  // 1. Early exit: blacklist check (fast-fail for logged-out tokens)
  // ------------------------------------------------------------------
  if (await isTokenBlacklisted(refreshToken)) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token has been revoked.");
  }

  // ------------------------------------------------------------------
  // 2. Verify JWT signature + claims
  // ------------------------------------------------------------------
  let decoded: ITokenPayload & { jti?: string };
  try {
    decoded = jwtHelpers.verifyToken(refreshToken, config.jwt.refreshSecret) as ITokenPayload & {
      jti?: string;
    };
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired refresh token.");
  }

  // ------------------------------------------------------------------
  // 3. Acquire per-token distributed lock (serialise concurrent rotations)
  // ------------------------------------------------------------------
  const locked = await acquireLock(tokenHash);
  if (!locked) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Token is being refreshed by another request. Please retry."
    );
  }

  try {
    // ----------------------------------------------------------------
    // 4. Look up token in DB
    // ----------------------------------------------------------------
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token not found or expired.");
    }

    // ----------------------------------------------------------------
    // 5. Reuse detection — if already revoked, the family is compromised
    // ----------------------------------------------------------------
    if (storedToken.revokedAt) {
      // Poison the token in Redis so any in-flight request also fails
      await blacklistToken(refreshToken, 7 * 24 * 60 * 60);
      // Revoke the entire family
      await prisma.refreshToken.updateMany({
        where: { familyId: storedToken.familyId },
        data: { revokedAt: new Date() },
      });
      throw new ApiError(httpStatus.UNAUTHORIZED, "Token reuse detected. All sessions revoked.");
    }

    // ----------------------------------------------------------------
    // 6. Atomically revoke the old token (conditional update)
    //    If count === 0, another request rotated it first → revoke family.
    // ----------------------------------------------------------------
    const { count: revokedCount } = await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (revokedCount === 0) {
      await blacklistToken(refreshToken, 7 * 24 * 60 * 60);
      await prisma.refreshToken.updateMany({
        where: { familyId: storedToken.familyId },
        data: { revokedAt: new Date() },
      });
      throw new ApiError(httpStatus.UNAUTHORIZED, "Token reuse detected. All sessions revoked.");
    }

    // ----------------------------------------------------------------
    // 7. Blacklist old token (blocks any in-flight concurrent request)
    // ----------------------------------------------------------------
    await blacklistToken(refreshToken, 7 * 24 * 60 * 60);

    // ----------------------------------------------------------------
    // 8. Issue new token pair (same family)
    // ----------------------------------------------------------------
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "User not found or account deactivated.");
    }

    const payload: ITokenPayload = { userId: user.id, email: user.email };
    const { accessToken, refreshToken: newRefreshToken } = jwtHelpers.generateAuthTokens(payload);

    await saveRefreshToken(user.id, newRefreshToken, {
      familyId: storedToken.familyId,
      userAgent,
      ip,
    });

    return { accessToken, refreshToken: newRefreshToken };
  } finally {
    await releaseLock(tokenHash);
  }
};

const logout = async (accessToken: string, refreshToken?: string) => {
  // Blacklist the access token — decode to get TTL
  try {
    const decoded = jwtHelpers.verifyToken(accessToken, config.jwt.secret);
    const now = Math.floor(Date.now() / 1000);
    const ttl = (decoded.exp ?? now + 900) - now;
    if (ttl > 0) {
      await blacklistToken(accessToken, ttl);
    }
  } catch {
    // Token expired already — that's fine
  }

  // Remove refresh token from DB
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await prisma.refreshToken.deleteMany({ where: { tokenHash } });
  }
};

const getMe = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }
  return user;
};

export const AuthService = {
  register,
  login,
  refreshAccessToken,
  logout,
  getMe,
};
