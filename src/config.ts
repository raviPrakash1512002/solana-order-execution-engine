import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3000),
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379)
  },
  pg: {
    host: process.env.PG_HOST || '127.0.0.1',
    port: Number(process.env.PG_PORT || 5432),
    database: process.env.PG_DATABASE || 'orders_db',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres'
  },
  queue: {
    concurrency: Number(process.env.QUEUE_CONCURRENCY || 10),
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 100),
    rateLimitDurationMs: Number(process.env.RATE_LIMIT_DURATION_MS || 60_000)
  }
};
