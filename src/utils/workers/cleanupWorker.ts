import prisma from "../../lib/prisma";
import logger from "../logger/logger";

// ---------------------------------------------------------------------------
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // every hour

// ---------------------------------------------------------------------------
// Prune expired & revoked refresh tokens (older than 7 days)
// ---------------------------------------------------------------------------
const pruneStaleRefreshTokens = async (): Promise<number> => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  const { count } = await prisma.refreshToken.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { lt: cutoff } }],
    },
  });
  return count;
};

// ---------------------------------------------------------------------------
// Worker loop
// ---------------------------------------------------------------------------
let running = false;
let timer: ReturnType<typeof setTimeout> | null = null;

const tick = async (): Promise<void> => {
  if (!running) return;
  try {
    const [rtCount] = await Promise.all([pruneStaleRefreshTokens()]);

    if (rtCount > 0) {
      logger.info({
        message: "Cleanup: pruned stale records",

        refreshTokens: rtCount,
      });
    }
  } catch (err) {
    logger.error({
      message: "Cleanup worker tick failed",
      error: err instanceof Error ? err.message : err,
    });
  } finally {
    if (running) {
      timer = setTimeout(tick, CLEANUP_INTERVAL_MS);
    }
  }
};

/** Start the cleanup worker. Safe to call multiple times. */
export const startCleanupWorker = (): void => {
  if (running) return;
  running = true;
  logger.info("🧹 Cleanup worker started (hourly)");
  tick();
};

/** Stop the cleanup worker. */
export const stopCleanupWorker = (): void => {
  running = false;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  logger.info("🧹 Cleanup worker stopped");
};
