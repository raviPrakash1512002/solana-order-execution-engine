import { Pool, QueryResult } from 'pg';
import { config } from '../config';
import { Order, OrderStatus } from '../types';

const pool = new Pool({
  host: config.pg.host,
  port: config.pg.port,
  database: config.pg.database,
  user: config.pg.user,
  password: config.pg.password,
  // Add some safety
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

export const OrderRepository = {
  async checkConnection(): Promise<boolean> {
    try {
      await pool.query('SELECT NOW()');
      return true;
    } catch (err) {
      console.error('Database connection check failed:', err);
      return false;
    }
  },

  async init() {
    const create = `
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      symbol TEXT,
      side TEXT,
      type TEXT,
      amount NUMERIC,
      filled NUMERIC,
      status TEXT,
      created_at TIMESTAMP,
      updated_at TIMESTAMP,
      meta JSONB
    );`;
    await pool.query(create);
  },

  async create(order: Order) {
    const q = `INSERT INTO orders(id, client_id, symbol, side, amount, filled, status, created_at, updated_at, meta)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (id) DO NOTHING`;
    await pool.query(q, [order.id, order.clientId, order.symbol, order.side, order.amount, order.filled, order.status, order.createdAt, order.updatedAt, order.meta || {}]);
    return order;
  },

  async updateFilled(id: string, filled: number, status: OrderStatus): Promise<Order | null> {
    const q = `UPDATE orders SET filled = $2, status = $3, updated_at = now() WHERE id = $1 RETURNING *`;
    const res = await pool.query<Order>(q, [id, filled, status]);
    return res.rows[0] || null;
  },

  async get(id: string): Promise<Order | null> {
    const res = await pool.query<Order>('SELECT * FROM orders WHERE id = $1', [id]);
    return res.rows[0] || null;
  }
};
