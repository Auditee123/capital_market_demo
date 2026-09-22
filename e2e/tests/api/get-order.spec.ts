import { test, expect } from '../../src/fixtures/fixtures';
import { OrderRequestBuilder } from '../../src/data/orderRequestBuilder';
import type { OrderResponse, ErrorResponse } from '../../src/types/order.types';

test.describe('Get order — API — positive', () => {
  test('returns the full order for its owning client', async ({ ordersApi }) => {
    const created: OrderResponse = await (
      await ordersApi.create(OrderRequestBuilder.aLimitOrder().withClientId('CLIENT_GET_01').withSymbol('MSFT').build())
    ).json();

    const response = await ordersApi.get(created.orderId, 'CLIENT_GET_01');

    expect(response.status()).toBe(200);
    const fetched: OrderResponse = await response.json();
    expect(fetched.orderId).toBe(created.orderId);
    expect(fetched.symbol).toBe('MSFT');
    expect(fetched.status).toBe('NEW');
  });
});

test.describe('Get order — API — negative', () => {
  test('rejects a request with no clientId query parameter', async ({ ordersApi }) => {
    const created: OrderResponse = await (
      await ordersApi.create(OrderRequestBuilder.aMarketOrder().withClientId('CLIENT_GET_02').build())
    ).json();

    const response = await ordersApi.get(created.orderId);

    expect(response.status()).toBe(400);
    const error: ErrorResponse = await response.json();
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  test('returns 404 for an order that does not exist', async ({ ordersApi }) => {
    const response = await ordersApi.get('ORD-999999999', 'CLIENT001');

    expect(response.status()).toBe(404);
    const error: ErrorResponse = await response.json();
    expect(error.code).toBe('ORDER_NOT_FOUND');
  });

  test('returns 403 when a different client requests the order', async ({ ordersApi }) => {
    const created: OrderResponse = await (
      await ordersApi.create(OrderRequestBuilder.aMarketOrder().withClientId('CLIENT_OWNER').build())
    ).json();

    const response = await ordersApi.get(created.orderId, 'CLIENT_INTRUDER');

    expect(response.status()).toBe(403);
    const error: ErrorResponse = await response.json();
    expect(error.code).toBe('FORBIDDEN');
  });
});

// Edge cases for this endpoint live in get-order.edge.spec.ts
