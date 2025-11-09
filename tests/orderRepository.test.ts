import { OrderRepository } from '../src/repository/orderRepository';
import { Order } from '../src/types';

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('OrderRepository', () => {
  const mockOrder: Order = {
    id: 'order1',
    clientId: 'client1',
    symbol: 'ETH/USDT',
    side: 'buy',
    type: 'market',
    amount: 1.5,
    filled: 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes order table on init()', async () => {
    const { Pool } = require('pg');
    const pool = Pool();
    pool.query.mockResolvedValueOnce({ rows: [] });
    
    await OrderRepository.init();
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS orders'));
  });

  it('creates new order', async () => {
    const { Pool } = require('pg');
    const pool = Pool();
    pool.query.mockResolvedValueOnce({ rows: [mockOrder] });
    
    const result = await OrderRepository.create(mockOrder);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO orders'),
      expect.arrayContaining([mockOrder.id])
    );
    expect(result).toEqual(mockOrder);
  });

  it('updates order filled amount and status', async () => {
    const { Pool } = require('pg');
    const pool = Pool();
    const updatedOrder = { ...mockOrder, filled: 1.5, status: 'filled' };
    pool.query.mockResolvedValueOnce({ rows: [updatedOrder] });
    
    const result = await OrderRepository.updateFilled(mockOrder.id, 1.5, 'filled');
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE orders SET filled'),
      expect.arrayContaining([mockOrder.id, 1.5, 'filled'])
    );
    expect(result).toEqual(updatedOrder);
  });

  it('returns null when updating non-existent order', async () => {
    const { Pool } = require('pg');
    const pool = Pool();
    pool.query.mockResolvedValueOnce({ rows: [] });
    
    const result = await OrderRepository.updateFilled('non-existent', 1, 'filled');
    expect(result).toBeNull();
  });
});