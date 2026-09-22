import { test, expect } from '../../src/fixtures/fixtures';
import { OrderRequestBuilder } from '../../src/data/orderRequestBuilder';
import type { OrderResponse, ErrorResponse } from '../../src/types/order.types';
import type { OrdersApiClient } from '../../src/api/ordersApiClient';

async function createOrder(ordersApi: OrdersApiClient, clientId: string): Promise<OrderResponse> {
  const response = await ordersApi.create(OrderRequestBuilder.aMarketOrder().withClientId(clientId).build());
  return response.json();
}

test.describe('Cancel order — API — positive', () => {
  test('cancels a NEW order using clientId in the query string', async ({ ordersApi }) => {
    const order = await createOrder(ordersApi, 'CLIENT_CANCEL_01');
    const response = await ordersApi.cancel(order.orderId, { queryClientId: 'CLIENT_CANCEL_01' });

    expect(response.status()).toBe(200);
    const cancelled: OrderResponse = await response.json();
    expect(cancelled.status).toBe('CANCELLED');
  });

  test('cancels a NEW order using clientId in the request body (no query string)', async ({ ordersApi }) => {
    const order = await createOrder(ordersApi, 'CLIENT_CANCEL_02');
    const response = await ordersApi.cancel(order.orderId, { bodyClientId: 'CLIENT_CANCEL_02' });

    expect(response.status()).toBe(200);
    const cancelled: OrderResponse = await response.json();
    expect(cancelled.status).toBe('CANCELLED');
  });
});

test.describe('Cancel order — API — negative', () => {
  test('rejects a cancel with no clientId anywhere', async ({ ordersApi }) => {
    const order = await createOrder(ordersApi, 'CLIENT_CANCEL_03');
    const response = await ordersApi.cancel(order.orderId);

    expect(response.status()).toBe(400);
    const error: ErrorResponse = await response.json();
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  test('returns 404 for a cancel on an order that does not exist', async ({ ordersApi }) => {
    const response = await ordersApi.cancel('ORD-999999998', { queryClientId: 'CLIENT001' });

    expect(response.status()).toBe(404);
    const error: ErrorResponse = await response.json();
    expect(error.code).toBe('ORDER_NOT_FOUND');
  });

  test('returns 403 when a different client attempts to cancel', async ({ ordersApi }) => {
    const order = await createOrder(ordersApi, 'CLIENT_CANCEL_OWNER');
    const response = await ordersApi.cancel(order.orderId, { queryClientId: 'CLIENT_CANCEL_INTRUDER' });

    expect(response.status()).toBe(403);
    const error: ErrorResponse = await response.json();
    expect(error.code).toBe('FORBIDDEN');
  });

  test('returns 409 when cancelling an already-cancelled order', async ({ ordersApi }) => {
    const order = await createOrder(ordersApi, 'CLIENT_CANCEL_04');
    await ordersApi.cancel(order.orderId, { queryClientId: 'CLIENT_CANCEL_04' });

    const response = await ordersApi.cancel(order.orderId, { queryClientId: 'CLIENT_CANCEL_04' });

    expect(response.status()).toBe(409);
    const error: ErrorResponse = await response.json();
    expect(error.code).toBe('ORDER_ALREADY_CANCELLED');
  });
});

// Edge cases for this endpoint live in cancel-order.edge.spec.ts
