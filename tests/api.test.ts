import { FastifyInstance } from 'fastify';
import { Queue, Worker } from 'bullmq';
import request from 'supertest';
import WebSocket from 'ws';
import { WsManager } from '../src/wsManager';
import createMockServer from './mocks/server';

jest.mock('bullmq');
jest.mock('../src/repository/orderRepository');
jest.mock('ioredis');
jest.mock('../src', () => {
  return jest.fn().mockImplementation((instance) => {
    Object.assign(instance, createMockServer());
    return Promise.resolve();
  });
});

describe('API Integration', () => {
  let app: FastifyInstance & { wsManager: typeof WsManager };
  let server: any;

  beforeAll(async () => {
    app = await require('fastify')();
    await app.register(require('../src'));
    server = app.server;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates order and returns order id', async () => {
    const response = await request(server)
      .post('/orders')
      .send({
        clientId: 'test1',
        symbol: 'ETH/USDT',
        side: 'buy',
        amount: 1
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
  });

  it('validates order input', async () => {
    const response = await request(server)
      .post('/orders')
      .send({
        // Missing required fields
        symbol: 'ETH/USDT'
      });

    expect(response.status).toBe(400);
  });

  it('broadcasts websocket updates', () => {
    app.wsManager.broadcast('order:update', {
      id: 'test1',
      status: 'filled',
      filled: 1,
      avgPrice: 100
    });

    expect(app.wsManager.broadcast).toHaveBeenCalledWith('order:update', {
      id: 'test1',
      status: 'filled',
      filled: 1,
      avgPrice: 100
    });
  });
});