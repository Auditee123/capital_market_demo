import { test, expect } from '../../src/fixtures/fixtures';
import { OrderRequestBuilder } from '../../src/data/orderRequestBuilder';
import type { OrderResponse, ErrorResponse } from '../../src/types/order.types';

test.describe('Create order — API — edge cases', () => {
  test('ignores a price supplied on a MARKET order', async ({ ordersApi }) => {
    const payload = OrderRequestBuilder.aMarketOrder().withPrice(999).build();
    const response = await ordersApi.create(payload);

    expect(response.status()).toBe(201);
    const order: OrderResponse = await response.json();
    expect(order.price).toBeNull();
  });

  test('ignores a client-supplied orderId — the server always assigns its own', async ({ ordersApi }) => {
    const payload = OrderRequestBuilder.aLimitOrder().withExtra('orderId', 'ORD-99999').build();
    const response = await ordersApi.create(payload);

    expect(response.status()).toBe(201);
    const order: OrderResponse = await response.json();
    expect(order.orderId).not.toBe('ORD-99999');
    expect(order.orderId).toMatch(/^ORD-\d+$/);
  });

  test('accepts unknown extra fields in the request without failing', async ({ ordersApi }) => {
    const payload = OrderRequestBuilder.aLimitOrder().withExtra('notes', 'urgent').build();
    const response = await ordersApi.create(payload);

    expect(response.status()).toBe(201);
  });

  test('KNOWN GAP (see docs/USER_STORY-order-lifecycle.md): malformed JSON returns 500, not a 400 validation error', async ({ ordersApi }) => {
    const response = await ordersApi.createRaw('{ this is not valid json ');

    // Documents today's actual behavior, so a future fix is a deliberate,
    // visible change to this test rather than a silent regression.
    expect(response.status()).toBe(500);
    const error: ErrorResponse = await response.json();
    expect(error.code).toBe('INTERNAL_ERROR');
  });
});
