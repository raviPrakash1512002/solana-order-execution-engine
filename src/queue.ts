import { Queue, Worker, JobsOptions, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { config } from './config';
import { processOrder } from './orderProcessor';
import { Order, OrderExecutionResult } from './types';

interface OrderJob {
  order: Order;
}

const connection = new IORedis({ 
  host: config.redis.host, 
  port: config.redis.port,
  maxRetriesPerRequest: 3
});

export const defaultQueueName = 'orders';

export const queue = new Queue(defaultQueueName, { connection });
export const events = new QueueEvents(defaultQueueName, { connection });

export async function checkConnection(): Promise<boolean> {
  try {
    await connection.ping();
    return true;
  } catch (err) {
    console.error('Redis connection check failed:', err);
    return false;
  }
}

export function createWorker() {
  const worker = new Worker<OrderJob, OrderExecutionResult>(
    defaultQueueName,
    async (job: Job<OrderJob>) => processOrder(job),
    {
      connection,
      concurrency: config.queue.concurrency,
      limiter: {
        max: config.queue.rateLimitMax,
        duration: config.queue.rateLimitDurationMs
      }
    }
  );

  worker.on('failed', (job: Job<OrderJob> | undefined, err: Error) => {
    console.error('Job failed:', {
      id: job?.id,
      orderId: job?.data.order.id,
      error: err.message,
      stack: err.stack
    });
  });

  return worker;
}

export function enqueueOrder(order: Order) {
  const opts: JobsOptions = {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: true,
    removeOnFail: false,
    jobId: order.id // use order.id as job.id for tracing
  };
  return queue.add('execute', { order }, opts);
}
