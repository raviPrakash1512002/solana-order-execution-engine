import { Counter, Gauge, Histogram, register, collectDefaultMetrics } from 'prom-client';
import { OrderType, OrderSide } from './types';

// Configure default metrics (GC, memory, etc.)
register.setDefaultLabels({
  app: 'order-execution-engine'
});

// Enable default metrics collection
collectDefaultMetrics({
  register,
  prefix: 'order_engine_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
});

// Order metrics
export const orderCounter = new Counter({
  name: 'orders_total',
  help: 'Total number of orders received',
  labelNames: ['type', 'side', 'status'] as const
});

export const orderExecutionTime = new Histogram({
  name: 'order_execution_duration_seconds',
  help: 'Time taken to execute orders',
  labelNames: ['type', 'side'] as const,
  buckets: [0.1, 0.5, 1, 2, 5]
});

export const orderFillRatio = new Gauge({
  name: 'order_fill_ratio',
  help: 'Order fill ratio (filled/total amount)',
  labelNames: ['type', 'side'] as const
});

// Queue metrics
export const queueSize = new Gauge({
  name: 'order_queue_size',
  help: 'Number of orders in queue'
});

export const queueLatency = new Histogram({
  name: 'order_queue_latency_seconds',
  help: 'Time spent in queue before processing',
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

// Connection metrics
export const websocketConnections = new Gauge({
  name: 'websocket_connections_current',
  help: 'Number of active WebSocket connections'
});

export const poolConnections = new Gauge({
  name: 'db_pool_connections',
  help: 'Database connection pool metrics',
  labelNames: ['state'] as const
});

// Error metrics
export const errorCounter = new Counter({
  name: 'order_errors_total',
  help: 'Total number of errors encountered',
  labelNames: ['type', 'operation'] as const
});

// Track order execution with improved granularity
export function trackOrderExecution(type: OrderType, side: OrderSide, startTime: number) {
  const duration = (Date.now() - startTime) / 1000;
  orderExecutionTime.labels(type, side).observe(duration);
  
  // Log execution for monitoring
  console.info(`Order execution completed - Type: ${type}, Side: ${side}, Duration: ${duration}s`);
}

// Track order creation
export function trackOrderCreated(type: OrderType, side: OrderSide) {
  orderCounter.labels(type, side, 'created').inc();
}

// Track order completion
export function trackOrderCompleted(type: OrderType, side: OrderSide, status: string, fillRatio: number) {
  orderCounter.labels(type, side, status).inc();
  orderFillRatio.labels(type, side).set(fillRatio);
}

// Track queue metrics
export function updateQueueMetrics(size: number, latencyMs: number) {
  queueSize.set(size);
  queueLatency.observe(latencyMs / 1000);
}

// Track WebSocket connections
export function trackWebSocketConnection(count: number) {
  websocketConnections.set(count);
}

// Track pool connections
export function trackPoolConnections(active: number, idle: number, waiting: number) {
  poolConnections.labels('active').set(active);
  poolConnections.labels('idle').set(idle);
  poolConnections.labels('waiting').set(waiting);
}

// Track errors
export function trackError(type: 'db' | 'queue' | 'dex' | 'ws', operation: string) {
  errorCounter.labels(type, operation).inc();
}

// Reset metrics (useful for tests)
export function resetMetrics() {
  register.resetMetrics();
  // Re-enable default metrics after reset
  collectDefaultMetrics({
    register,
    prefix: 'order_engine_',
    gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
  });
}

// Export register for use in metrics endpoint
export { register };