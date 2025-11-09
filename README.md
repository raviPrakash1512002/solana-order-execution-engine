# order-execution-engine-mock

A mock DEX order execution engine with market and limit orders, WebSocket updates, and Prometheus metrics. Built with TypeScript, Node.js, PostgreSQL, Redis, and BullMQ.

## Features

- **Order Types**: Market and Limit orders with GTC/IOC/FOK time-in-force
- **Real-time Updates**: WebSocket API for order status notifications
- **Queue Processing**: BullMQ-backed order queue with retries and rate limiting
- **Monitoring**: Prometheus metrics for orders, queues, and connections
- **Persistence**: PostgreSQL for order storage
- **Mock DEX**: Simulated execution with realistic fill ratios and slippage

## Architecture

- **API**: Fastify HTTP + WebSocket server
- **Queue**: BullMQ + Redis for order processing
- **Storage**: PostgreSQL order repository
- **Metrics**: Prometheus client with histograms/counters
- **Docker**: Multi-container setup with health checks

This scaffold is intended as a starting point for the assignment described in the provided PDF.

## Quick Start

1. Clone and setup:
```bash
git clone https://github.com/yourusername/order-execution-engine-mock.git
cd order-execution-engine-mock
cp .env.example .env
npm install
```

2. Start infrastructure:
```bash
docker compose up -d  # Starts Postgres + Redis
```

3. Run the server:
```bash
npm run dev  # Development mode with hot reload
# or
npm run build && npm start  # Production mode
```

## API Documentation

### HTTP Endpoints

#### Create Order
```http
POST /orders
Content-Type: application/json

{
  "clientId": "user123",
  "symbol": "ETH/USDT",
  "side": "buy",
  "amount": 1.5,
  "type": "limit",           // Optional, defaults to "market"
  "limitPrice": 1800.50,     // Required for limit orders
  "timeInForce": "GTC"      // Optional, defaults to "GTC"
}

Response: { "id": "order-uuid" }
```

#### Health Check
```http
GET /health

Response: { 
  "status": "ok",
  "postgres": "connected",
  "redis": "connected",
  "version": "1.0.0",
  "timestamp": "2025-11-09T09:42:24.104Z"
}
```

#### Metrics
```http
GET /metrics

Response: Prometheus metrics format
# HELP order_queue_size Number of orders in queue
# TYPE order_queue_size gauge
order_queue_size 5

# HELP order_execution_duration_seconds Time taken to execute orders
# TYPE order_execution_duration_seconds histogram
...
```

### WebSocket API

Connect to `ws://localhost:3000/ws?clientId=user123`

Events:
- `order:update`: Order status updates
  ```json
  {
    "event": "order:update",
    "payload": {
      "id": "order-uuid",
      "status": "filled",
      "filled": 1.5,
      "avgPrice": 1805.75
    }
  }
  ```

## Available Scripts

```bash
# Install dependencies
npm install

# Development mode with hot reload
npm run dev

# Build TypeScript
npm run build

# Production start
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint
```

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment:
```bash
cp .env.example .env
```

3. Configure your `.env`:
```env
# Server
PORT=3000

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=orders

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Queue Config
QUEUE_CONCURRENCY=5
QUEUE_RATE_LIMIT_MAX=100
QUEUE_RATE_LIMIT_DURATION_MS=1000
```

4. Start infrastructure using Docker:
```bash
docker-compose up -d postgres redis
```

5. Run in development mode:
```bash
npm run dev
```

## Testing

The project includes both unit and integration tests:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test tests/api.test.ts
```

Test files are located in the `tests/` directory:
- `api.test.ts`: API endpoint testing
- `orderRepository.test.ts`: Database operations testing

## Monitoring

### Available Metrics

Order Metrics:
- `orders_total{type="market|limit",side="buy|sell",status="created|filled|failed"}`
- `order_execution_duration_seconds{type="market|limit",side="buy|sell"}`
- `order_fill_ratio{type="market|limit",side="buy|sell"}`

Queue Metrics:
- `order_queue_size`
- `order_queue_latency_seconds`

Connection Metrics:
- `websocket_connections_current`
- `db_pool_connections{state="active|idle|waiting"}`

System Metrics:
- `nodejs_gc_duration_seconds`
- `nodejs_heap_size_bytes`
- `process_cpu_seconds_total`

## Docker Support

Build and run all services:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

Services:
- `app`: Order execution engine
- `postgres`: PostgreSQL database
- `redis`: Redis for queue

## Troubleshooting

1. Database Connection Issues:
   - Check PostgreSQL service is running
   - Verify database credentials in `.env`
   - Check database logs: `docker-compose logs postgres`

2. Queue Processing Issues:
   - Check Redis connection
   - Verify Redis service status
   - Check queue metrics for backlog

3. WebSocket Connection Issues:
   - Check client connection URL
   - Verify port forwarding if using Docker
   - Check WebSocket connection count metric

## Production Deployment

For production deployment:

1. Set environment variables properly
2. Configure proper logging levels
3. Set up Prometheus monitoring
4. Configure appropriate queue settings
5. Enable SSL/TLS for WebSocket
6. Implement rate limiting
7. Set up database backups
8. Use process manager (e.g., PM2)

## License

MIT

#### Health Check
```http
GET /health

Response: { 
  "status": "ok",
  "postgres": "connected",
  "redis": "connected"
}
```

#### Metrics
```http
GET /metrics

Response: Prometheus metrics format
```

### WebSocket API

Connect to `ws://localhost:3000/ws?clientId=user123`

Events:
- `order:update`: Order status updates
  ```json
  {
    "event": "order:update",
    "payload": {
      "id": "order-uuid",
      "status": "filled",
      "filled": 1.5,
      "avgPrice": 1805.75
    }
  }
  ```

## Metrics

### Order Metrics
- `orders_total`: Counter of orders by type/side/status
- `order_execution_duration_seconds`: Execution time histogram
- `order_fill_ratio`: Fill ratio by order type/side

### Queue Metrics
- `order_queue_size`: Current queue size
- `order_queue_latency_seconds`: Time in queue histogram

### Connection Metrics
- `websocket_connections_current`: Active WS connections
- `db_pool_connections`: Pool stats by state

## Configuration

Environment variables (see `.env.example`):
- `PORT`: Server port (default: 3000)
- `REDIS_*`: Redis connection
- `PG_*`: Postgres connection
- `QUEUE_*`: Queue settings

## Development

Run tests:
```bash
npm test               # All tests
npm test -- --watch   # Watch mode
```

Lint:
```bash
npm run lint
```

## Docker

Build image:
```bash
docker build -t order-engine .
```

Run with compose:
```bash
docker compose up -d
```

- The current implementation focuses on Market Orders. Limit/Sniper would be added via additional job types and a small strategy engine.
- Tests are provided as skeletons in `tests/` and can be extended.
