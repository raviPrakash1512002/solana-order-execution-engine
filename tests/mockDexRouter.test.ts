import { MockDexRouter } from '../src/mockDexRouter';
import { CreateOrderDTO } from '../src/types';

describe('MockDexRouter', () => {
  const mockOrder: CreateOrderDTO = {
    clientId: 'test1',
    symbol: 'ETH/USDT',
    side: 'buy',
    amount: 1.5
  };

  it('executes market order and returns executed amount and price', async () => {
    const res = await MockDexRouter.executeMarketOrder(mockOrder);
    expect(res).toHaveProperty('executedAmount');
    expect(res).toHaveProperty('avgPrice');
    expect(res.executedAmount).toBeGreaterThan(0);
    expect(res.executedAmount).toBeLessThanOrEqual(mockOrder.amount);
  });

  it('simulates partial fills between 90-100%', async () => {
    const res = await MockDexRouter.executeMarketOrder(mockOrder);
    const fillRatio = res.executedAmount / mockOrder.amount;
    expect(fillRatio).toBeGreaterThanOrEqual(0.9);
    expect(fillRatio).toBeLessThanOrEqual(1.0);
  });

  it('applies slippage based on order side', async () => {
    const buyOrder = await MockDexRouter.executeMarketOrder(mockOrder);
    const sellOrder = await MockDexRouter.executeMarketOrder({ ...mockOrder, side: 'sell' });
    
    // Buy should have positive slippage (price higher than mid)
    expect(buyOrder.avgPrice).toBeGreaterThan(100);
    // Sell should have negative slippage (price lower than mid)
    expect(sellOrder.avgPrice).toBeLessThan(100);
  });
});