import { CreateOrderDTO } from './types';

/**
 * MockDexRouter simulates a DEX/router execution.
 * It returns an execution result with executedAmount and avgPrice.
 */
export const MockDexRouter = {
  getMockPrice() {
    // Simulated market price between 95-105
    return 100 + (Math.random() * 10 - 5);
  },

  async executeMarketOrder(order: CreateOrderDTO) {
    await new Promise((r) => setTimeout(r, Math.random() * 200 + 50));

    const filledRatio = 0.9 + Math.random() * 0.1;
    const executedAmount = Number((order.amount * filledRatio).toFixed(8));
    const midPrice = this.getMockPrice();
    const slippagePct = (Math.random() * 0.005) * (order.side === 'buy' ? 1 : -1);
    const avgPrice = midPrice * (1 + slippagePct);

    return {
      executedAmount,
      avgPrice,
      raw: { slippagePct, filledRatio }
    };
  },

  async executeLimitOrder(order: CreateOrderDTO) {
    if (!order.limitPrice) {
      throw new Error('Limit price required for limit orders');
    }

    await new Promise((r) => setTimeout(r, Math.random() * 200 + 50));

    const marketPrice = this.getMockPrice();
    const isPriceMatch = order.side === 'buy' 
      ? marketPrice <= order.limitPrice  // Buy: market price below or at limit
      : marketPrice >= order.limitPrice; // Sell: market price above or at limit

    if (!isPriceMatch) {
      return {
        executedAmount: 0,
        avgPrice: marketPrice,
        raw: { 
          priceMatch: false,
          marketPrice,
          limitPrice: order.limitPrice
        }
      };
    }

    // Price matches - execute with less slippage than market orders
    const filledRatio = 0.95 + Math.random() * 0.05; // 95-100% fill for limit orders
    const executedAmount = Number((order.amount * filledRatio).toFixed(8));
    const slippagePct = (Math.random() * 0.002) * (order.side === 'buy' ? 1 : -1); // Less slippage
    const avgPrice = order.limitPrice * (1 + slippagePct);

    return {
      executedAmount,
      avgPrice,
      raw: {
        priceMatch: true,
        slippagePct,
        filledRatio,
        marketPrice
      }
    };
  }
};
