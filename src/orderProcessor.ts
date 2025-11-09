import { Job } from 'bullmq';
import { MockDexRouter } from './mockDexRouter';
import { OrderRepository } from './repository/orderRepository';
import { WsManager } from './wsManager';
import { Order, OrderUpdateEvent, OrderExecutionResult } from './types';
import { trackOrderExecution, trackOrderCompleted, updateQueueMetrics, trackError } from './metrics';

interface OrderJob {
  order: Order;
}

export async function processOrder(job: Job<OrderJob>): Promise<OrderExecutionResult> {
  const order = job.data.order;
  const startTime = Date.now();
  await OrderRepository.updateFilled(order.id, order.filled, 'processing');
  
  // Track queue latency if timestamp is available
  if (job.timestamp) {
    const queueLatency = startTime - job.timestamp;
    updateQueueMetrics(1, queueLatency); // Use 1 as we know there's at least this job
  }

  try {
    const orderData = {
      clientId: order.clientId,
      symbol: order.symbol,
      side: order.side,
      amount: order.amount,
      type: order.type || 'market',
      limitPrice: order.meta?.limitPrice,
      timeInForce: order.meta?.timeInForce
    };

    let exec: OrderExecutionResult;
    if (order.type === 'limit') {
      exec = await MockDexRouter.executeLimitOrder(orderData);
    } else {
      exec = await MockDexRouter.executeMarketOrder(orderData);
    }

    // No fill for limit orders that don't match price
    if (exec.executedAmount === 0 && order.type === 'limit') {
      const updatedOrder = await OrderRepository.updateFilled(order.id, 0, 'pending');
      if (!updatedOrder) {
        throw new Error(`Order ${order.id} not found during update`);
      }

      const update: OrderUpdateEvent = {
        id: order.id,
        status: 'pending',
        reason: 'Price not matched'
      };
      WsManager.broadcast('order:update', update);
      return exec;
    }

    const newFilled = Math.min(order.amount, exec.executedAmount);
    const status = newFilled >= order.amount ? 'filled' : 'pending';
    const updatedOrder = await OrderRepository.updateFilled(order.id, newFilled, status);
    
    if (!updatedOrder) {
      throw new Error(`Order ${order.id} not found during update`);
    }

    // Track execution metrics
    trackOrderExecution(order.type, order.side, startTime);
    trackOrderCompleted(order.type, order.side, status, newFilled / order.amount);

    const update: OrderUpdateEvent = { 
      id: order.id, 
      filled: newFilled, 
      status, 
      avgPrice: exec.avgPrice 
    };
    WsManager.broadcast('order:update', update);

    return exec;
  } catch (err) {
    console.error(`Order ${order.id} execution failed:`, err);
    await OrderRepository.updateFilled(order.id, order.filled, 'failed');
    
    // Track failed order with enhanced error tracking
    trackOrderCompleted(order.type, order.side, 'failed', order.filled / order.amount);
    trackError('dex', 'order_execution');
    
    const update: OrderUpdateEvent = {
      id: order.id,
      status: 'failed',
      reason: err instanceof Error ? err.message : String(err)
    };
    WsManager.broadcast('order:update', update);
    throw err;
  }
}
