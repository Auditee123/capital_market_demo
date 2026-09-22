import { test, expect } from '../../src/fixtures/fixtures';
import { OrderRequestBuilder } from '../../src/data/orderRequestBuilder';
import type { OrderResponse } from '../../src/types/order.types';
import type { OrdersApiClient } from '../../src/api/ordersApiClient';

async function createOrder(ordersApi: OrdersApiClient, clientId: string): Promise<OrderResponse> {
  const response = await ordersApi.create(OrderRequestBuilder.aMarketOrder().withClientId(clientId).build());
  return response.json();
}

test.describe('Cancel order — API — edge cases', () => {
  test('when clientId is given both in the query string and the body, the query string silently wins', async ({ ordersApi }) => {
    const order = await createOrder(ordersApi, 'CLIENT_CANCEL_05');

    // Query says the correct owner; body says a bogus client — documents today's precedence.
    const response = await ordersApi.cancel(order.orderId, {
      queryClientId: 'CLIENT_CANCEL_05',
      bodyClientId: 'SOMEONE_ELSE',
    });

    expect(response.status()).toBe(200);
    const cancelled: OrderResponse = await response.json();
    expect(cancelled.status).toBe('CANCELLED');
  });
});
