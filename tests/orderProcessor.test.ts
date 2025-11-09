import { MockDexRouter } from '../src/mockDexRouter';

describe('MockDexRouter', () => {
  it('executes market order and returns executed amount and price', async () => {
    const res = await MockDexRouter.executeMarketOrder({ clientId: 'c1', symbol: 'ETH/USDT', side: 'buy', amount: 1 });
    expect(res).toHaveProperty('executedAmount');
    expect(res).toHaveProperty('avgPrice');
    expect(res.executedAmount).toBeGreaterThan(0);
  });
});
