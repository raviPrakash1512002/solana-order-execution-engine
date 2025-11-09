import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import websocketPlugin from '@fastify/websocket';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config';
import { enqueueOrder, createWorker, events } from './queue';
import { OrderRepository } from './repository/orderRepository';
import { WsManager } from './wsManager';
import { CreateOrderDTO, Order } from './types';
import { checkConnection } from './queue';
import { register, trackOrderCreated, trackWebSocketConnection } from './metrics';

interface OrderRequest extends FastifyRequest {
  body: CreateOrderDTO;
}

interface WsQuerystring {
  clientId?: string;
}

const fastify: FastifyInstance = Fastify({ logger: true });
fastify.register(websocketPlugin);

// Health check endpoint
fastify.get('/health', async () => {
  const [dbStatus, redisStatus] = await Promise.all([
    OrderRepository.checkConnection(),
    checkConnection()
  ]);

  const systemOk = dbStatus && redisStatus;
  
  return { 
    status: systemOk ? 'ok' : 'error',
    postgres: dbStatus ? 'connected' : 'error',
    redis: redisStatus ? 'connected' : 'error',
    version: process.env.npm_package_version,
    timestamp: new Date().toISOString()
  };
});

// Prometheus metrics endpoint
fastify.get('/metrics', async (_, reply) => {
  try {
    const metrics = await register.metrics();
    return reply.type('text/plain').send(metrics);
  } catch (err) {
    reply.status(500).send(err);
  }
});

fastify.post<{Body: CreateOrderDTO}>('/orders', async (req: FastifyRequest<{Body: CreateOrderDTO}>, reply: FastifyReply) => {
  const { clientId, symbol, amount, side } = req.body;
  
  // minimal validation
  if (!clientId || !symbol || !amount || !side) {
    return reply.status(400).send({ error: 'missing fields' });
  }

  const id = uuidv4();
  const now = new Date().toISOString();
  
  const order: Order = {
    id,
    clientId,
    symbol,
    side,
    type: 'market', // Default to market order if not specified
    amount,
    filled: 0,
    status: 'pending',
    createdAt: now,
    updatedAt: now
  };

  try {
    await OrderRepository.create(order);
    await enqueueOrder(order);
    
    // Track order creation metrics
    trackOrderCreated(order.type, order.side);
    
    return { id };
  } catch (err) {
    fastify.log.error(err);
    throw err;
  }
});

fastify.register(async function (instance: FastifyInstance) {
  instance.get('/ws', { 
    websocket: true 
  }, (connection, req: FastifyRequest<{Querystring: WsQuerystring}>) => {
    const clientId = req.query.clientId || uuidv4();
    WsManager.add(String(clientId), connection.socket);
    trackWebSocketConnection(WsManager.getConnectionCount());
    
    connection.socket.on('close', () => {
      WsManager.remove(String(clientId));
      trackWebSocketConnection(WsManager.getConnectionCount());
    });
  });
});

async function start() {
  let worker;
  try {
    await OrderRepository.init();
    
    // Start queue worker and listen for events
    worker = createWorker();
    events.on('completed', ({ jobId }) => {
      fastify.log.info(`Job ${jobId} completed successfully`);
    });

    events.on('failed', ({ jobId, failedReason }) => {
      fastify.log.error(`Job ${jobId} failed: ${failedReason}`);
    });

    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on port ${config.port}`);
  } catch (err) {
    fastify.log.error({ err }, 'Failed to start server');
    if (worker) {
      await worker.close();
    }
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  fastify.log.info('Received SIGTERM signal, shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

start().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
