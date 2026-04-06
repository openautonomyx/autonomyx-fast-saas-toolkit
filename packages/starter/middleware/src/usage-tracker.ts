import type { Pool } from "pg";
import type Redis from "ioredis";
import type { IncomingMessage, ServerResponse } from "node:http";

export interface UsageTrackerOptions {
  db: Pool;
  redis: Redis;
  /** Flush buffer to DB every N seconds (default: 30) */
  flushIntervalSeconds?: number;
  /** Lago API URL for sending billing events */
  lagoApiUrl?: string;
  /** Lago API key */
  lagoApiKey?: string;
}

interface UsageEvent {
  tenantId: string;
  eventType: string;
  properties: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Tracks API usage per tenant for metered billing.
 * Buffers events in Redis, periodically flushes to PostgreSQL,
 * and optionally forwards to Lago for billing.
 */
export function createUsageTracker(options: UsageTrackerOptions) {
  const {
    db,
    redis,
    flushIntervalSeconds = 30,
    lagoApiUrl,
    lagoApiKey,
  } = options;

  const BUFFER_KEY = "usage:buffer";
  let flushTimer: ReturnType<typeof setInterval> | null = null;

  // Start periodic flush
  if (!flushTimer) {
    flushTimer = setInterval(() => flushBuffer(db, redis, lagoApiUrl, lagoApiKey), flushIntervalSeconds * 1000);
  }

  return async (
    req: IncomingMessage & { tenantContext?: any; url?: string; method?: string },
    res: ServerResponse,
    next: (err?: Error) => void
  ) => {
    // Only track for authenticated tenant requests
    if (!req.tenantContext?.tenant) {
      return next();
    }

    const event: UsageEvent = {
      tenantId: req.tenantContext.tenant.id,
      eventType: "api_call",
      properties: {
        method: req.method,
        path: new URL(req.url || "/", "http://localhost").pathname,
      },
      timestamp: new Date(),
    };

    // Buffer in Redis (non-blocking)
    redis.rpush(BUFFER_KEY, JSON.stringify(event)).catch(() => {});

    next();
  };
}

async function flushBuffer(db: Pool, redis: Redis, lagoApiUrl?: string, lagoApiKey?: string) {
  const batchSize = 500;
  const events: string[] = [];

  // Pop up to batchSize events atomically
  for (let i = 0; i < batchSize; i++) {
    const event = await redis.lpop("usage:buffer");
    if (!event) break;
    events.push(event);
  }

  if (events.length === 0) return;

  const parsed = events.map(e => JSON.parse(e) as UsageEvent);

  // Bulk insert into PostgreSQL
  const values = parsed.map((e, i) => {
    const offset = i * 4;
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
  }).join(", ");

  const params = parsed.flatMap(e => [e.tenantId, e.eventType, JSON.stringify(e.properties), e.timestamp]);

  await db.query(
    `INSERT INTO usage_events (tenant_id, event_type, properties, timestamp) VALUES ${values}`,
    params
  );

  // Forward to Lago if configured
  if (lagoApiUrl && lagoApiKey) {
    for (const event of parsed) {
      fetch(`${lagoApiUrl}/api/v1/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lagoApiKey}`,
        },
        body: JSON.stringify({
          event: {
            transaction_id: crypto.randomUUID(),
            external_subscription_id: event.tenantId,
            code: event.eventType,
            timestamp: Math.floor(event.timestamp.getTime() / 1000),
            properties: event.properties,
          },
        }),
      }).catch(() => {}); // Fire and forget
    }
  }
}
