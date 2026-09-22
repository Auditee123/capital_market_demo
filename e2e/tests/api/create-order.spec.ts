import { test, expect } from '../../src/fixtures/fixtures';
import { OrderRequestBuilder } from '../../src/data/orderRequestBuilder';
import type { OrderResponse, ErrorResponse } from '../../src/types/order.types';

test.describe('Create order — API — positive', () => {
  test('creates a valid LIMIT BUY order', async ({ ordersApi }) => {
    const payload = OrderRequestBuilder.aLimitOrder().withSide('BUY').withQuantity(100).withPrice(225.5).build();
    const response = await ordersApi.create(payload);

    expect(response.status()).toBe(201);
    const order: OrderResponse = await response.json();
    expect(order.status).toBe('NEW');
    expect(order.side).toBe('BUY');
    expect(order.price).toBe(225.5);
    expect(order.orderId).toMatch(/^ORD-\d+$/);
  });

  test('creates a valid LIMIT SELL order', async ({ ordersApi }) => {
    const payload = OrderRequestBuilder.aLimitOrder().withSide('SELL').build();
    const response = await ordersApi.create(payload);

    expect(response.status()).toBe(201);
    const order: OrderResponse = await response.json();
    expect(order.side).toBe('SELL');
    expect(order.status).toBe('NEW');
  });

  test('creates a valid MARKET BUY order without a price', async ({ ordersApi }) => {
    const payload = OrderRequestBuilder.aMarketOrder().withSide('BUY').build();
    const response = await ordersApi.create(payload);

    expect(response.status()).toBe(201);
    const order: OrderResponse = await response.json();
    expect(order.price).toBeNull();
    expect(order.status).toBe('NEW');
  });

  test('creates a valid MARKET SELL order without a price', async ({ ordersApi }) => {
    const payload = OrderRequestBuilder.aMarketOrder().withSide('SELL').build();
    const response = await ordersApi.create(payload);

    expect(response.status()).toBe(201);
    const order: OrderResponse = await response.json();
    expect(order.price).toBeNull();
  });

  test('rounds a LIMIT price to 2 decimal places', async ({ ordersApi }) => {
    const payload = OrderRequestBuilder.aLimitOrder().withPrice(225.567).build();
    const response = await ordersApi.create(payload);

    expect(response.status()).toBe(201);
    const order: OrderResponse = await response.json();
    expect(order.price).toBe(225.57);
  });

  test('generates a unique, increasing order ID for each new order', async ({ ordersApi }) => {
    const first: OrderResponse = await (await ordersApi.create(OrderRequestBuilder.aMarketOrder().build())).json();
    const second: OrderResponse = await (await ordersApi.create(OrderRequestBuilder.aMarketOrder().build())).json();

    expect(first.orderId).not.toBe(second.orderId);
    const firstSeq = Number(first.orderId.split('-')[1]);
    const secondSeq = Number(second.orderId.split('-')[1]);
    expect(secondSeq).toBeGreaterThan(firstSeq);
  });
});

test.describe('Create order — API — negative (validation)', () => {
  const cases: Array<{ name: string; payload: Record<string, unknown>; expectedCode: string }> = [
    { name: 'missing clientId', payload: OrderRequestBuilder.aLimitOrder().without('clientId').build(), expectedCode: 'VALIDATION_ERROR' },
    { name: 'clientId is not a string', payload: OrderRequestBuilder.aLimitOrder().withClientId(12345).build(), expectedCode: 'VALIDATION_ERROR' },
    { name: 'missing symbol', payload: OrderRequestBuilder.aLimitOrder().without('symbol').build(), expectedCode: 'VALIDATION_ERROR' },
    { name: 'invalid side', payload: OrderRequestBuilder.aLimitOrder().withSide('HOLD').build(), expectedCode: 'VALIDATION_ERROR' },
    { name: 'missing orderType', payload: OrderRequestBuilder.aLimitOrder().without('orderType').build(), expectedCode: 'VALIDATION_ERROR' },
    { name: 'invalid orderType', payload: OrderRequestBuilder.aLimitOrder().withOrderType('STOP').build(), expectedCode: 'VALIDATION_ERROR' },
    { name: 'quantity is zero', payload: OrderRequestBuilder.aMarketOrder().withQuantity(0).build(), expectedCode: 'VALIDATION_ERROR' },
    { name: 'quantity is negative', payload: OrderRequestBuilder.aMarketOrder().withQuantity(-10).build(), expectedCode: 'VALIDATION_ERROR' },
    { name: 'quantity is not a number', payload: OrderRequestBuilder.aMarketOrder().withQuantity('one hundred').build(), expectedCode: 'VALIDATION_ERROR' },
    { name: 'LIMIT order missing a price', payload: OrderRequestBuilder.aLimitOrder().without('price').build(), expectedCode: 'VALIDATION_ERROR' },
    { name: 'LIMIT order with price = 0', payload: OrderRequestBuilder.aLimitOrder().withPrice(0).build(), expectedCode: 'VALIDATION_ERROR' },
    { name: 'LIMIT order with a negative price', payload: OrderRequestBuilder.aLimitOrder().withPrice(-5).build(), expectedCode: 'VALIDATION_ERROR' },
    { name: 'LIMIT order with a non-numeric price', payload: OrderRequestBuilder.aLimitOrder().withPrice('cheap').build(), expectedCode: 'VALIDATION_ERROR' },
    { name: 'completely empty request body', payload: {}, expectedCode: 'VALIDATION_ERROR' },
  ];

  for (const { name, payload, expectedCode } of cases) {
    test(`rejects: ${name}`, async ({ ordersApi }) => {
      const response = await ordersApi.create(payload);

      expect(response.status()).toBe(400);
      const error: ErrorResponse = await response.json();
      expect(error.code).toBe(expectedCode);
      expect(error.message).toBeTruthy();
    });
  }
});

// Edge cases for this endpoint live in create-order.edge.spec.ts
