import { OrderType, Side, type OrderPayload } from '../types/order.types';

const DEFAULT_LIMIT_PRICE = 225.5;

/** Builder for create-order request payloads, with sane defaults and per-test overrides. */
export class OrderRequestBuilder {
  private payload: OrderPayload = {
    clientId: 'CLIENT001',
    symbol: 'AAPL',
    side: Side.BUY,
    orderType: OrderType.LIMIT,
    quantity: 100,
    price: DEFAULT_LIMIT_PRICE,
  };

  static aLimitOrder(): OrderRequestBuilder {
    return new OrderRequestBuilder().withOrderType(OrderType.LIMIT).withPrice(DEFAULT_LIMIT_PRICE);
  }

  static aMarketOrder(): OrderRequestBuilder {
    return new OrderRequestBuilder().withOrderType(OrderType.MARKET).without('price');
  }

  withClientId(clientId: unknown): this {
    this.payload.clientId = clientId;
    return this;
  }

  withSymbol(symbol: unknown): this {
    this.payload.symbol = symbol;
    return this;
  }

  withSide(side: unknown): this {
    this.payload.side = side;
    return this;
  }

  withOrderType(orderType: unknown): this {
    this.payload.orderType = orderType;
    return this;
  }

  withQuantity(quantity: unknown): this {
    this.payload.quantity = quantity;
    return this;
  }

  withPrice(price: unknown): this {
    this.payload.price = price;
    return this;
  }

  withExtra(field: string, value: unknown): this {
    this.payload[field] = value;
    return this;
  }

  without(field: string): this {
    delete this.payload[field];
    return this;
  }

  build(): OrderPayload {
    return { ...this.payload };
  }
}
