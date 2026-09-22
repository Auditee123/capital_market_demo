import { test, expect } from '../../src/fixtures/fixtures';
import { OrderRequestBuilder } from '../../src/data/orderRequestBuilder';
import type { OrderResponse } from '../../src/types/order.types';

test.describe('Get order — API — edge cases', () => {
  test('order lookup is case-sensitive', async ({ ordersApi }) => {
    const created: OrderResponse = await (
      await ordersApi.create(OrderRequestBuilder.aMarketOrder().withClientId('CLIENT_CASE').build())
    ).json();

    const response = await ordersApi.get(created.orderId.toLowerCase(), 'CLIENT_CASE');

    expect(response.status()).toBe(404);
  });

  test("KNOWN GAP: an unmapped route doesn't return the app's standard {code, message} error shape", async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/api/v1/unknown-resource`);

    expect(response.status()).toBe(404);
    const contentType = response.headers()['content-type'] ?? '';
    // Documents today's behavior: Express's default 404 handler (HTML), not errorHandler's JSON shape.
    expect(contentType).not.toContain('application/json');
  });
});
