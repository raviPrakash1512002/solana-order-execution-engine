export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'sniper';
export type OrderStatus = 'pending' | 'processing' | 'filled' | 'failed' | 'cancelled';

export interface CreateOrderDTO {
  clientId: string;
  symbol: string;
  side: OrderSide;
  amount: number; // base asset amount
  type?: OrderType;
  limitPrice?: number; // required for limit orders
  timeInForce?: 'GTC' | 'IOC' | 'FOK'; // Good Till Cancel, Immediate or Cancel, Fill or Kill
}

export interface OrderMetadata {
  limitPrice?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  marketPrice?: number;
  slippagePct?: number;
  [key: string]: unknown;
}

export interface Order {
  id: string;
  clientId: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  amount: number;
  filled: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  meta?: OrderMetadata;
}

export interface OrderExecutionResult {
  executedAmount: number;
  avgPrice: number;
  raw?: {
    slippagePct?: number;
    filledRatio?: number;
    priceMatch?: boolean;
    marketPrice?: number;
    limitPrice?: number;
  };
}

export interface OrderUpdateEvent {
  id: string;
  filled?: number;
  status: OrderStatus;
  avgPrice?: number;
  reason?: string;
}
