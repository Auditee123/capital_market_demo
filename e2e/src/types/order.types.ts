export const Side = {
  BUY: 'BUY',
  SELL: 'SELL',
} as const;
export type Side = (typeof Side)[keyof typeof Side];

export const OrderType = {
  MARKET: 'MARKET',
  LIMIT: 'LIMIT',
} as const;
export type OrderType = (typeof OrderType)[keyof typeof OrderType];

export const OrderStatus = {
  NEW: 'NEW',
  CANCELLED: 'CANCELLED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export interface OrderResponse {
  orderId: string;
  clientId: string;
  symbol: string;
  side: Side;
  orderType: OrderType;
  quantity: number;
  price: number | null;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ErrorResponse {
  code: string;
  message: string;
}

/** Loosely typed on purpose — negative tests deliberately send malformed shapes. */
export type OrderPayload = Record<string, unknown>;
