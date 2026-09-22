import { test, expect } from '../../src/fixtures/fixtures';
import { OrderRequestBuilder } from '../../src/data/orderRequestBuilder';
import type { OrderResponse } from '../../src/types/order.types';

test.describe('Cancel order — UI', () => {
  test('cancelling a NEW order shows CANCELLED', async ({ orderPage, ordersApi }) => {
    const created: OrderResponse = await (
      await ordersApi.create(OrderRequestBuilder.aMarketOrder().withClientId('CLIENT_UI_CANCEL_01').build())
    ).json();

    const result = await orderPage.cancelOrder({ orderId: created.orderId, clientId: 'CLIENT_UI_CANCEL_01' });

    expect(result.status).toBe('CANCELLED');
  });

  test('cancelling an already-cancelled order shows ORDER_ALREADY_CANCELLED', async ({ orderPage, ordersApi }) => {
    const created: OrderResponse = await (
      await ordersApi.create(OrderRequestBuilder.aMarketOrder().withClientId('CLIENT_UI_CANCEL_02').build())
    ).json();
    await ordersApi.cancel(created.orderId, { queryClientId: 'CLIENT_UI_CANCEL_02' });

    const result = await orderPage.cancelOrder({ orderId: created.orderId, clientId: 'CLIENT_UI_CANCEL_02' });

    expect(result.code).toBe('ORDER_ALREADY_CANCELLED');
  });

  test("cancelling someone else's order shows FORBIDDEN", async ({ orderPage, ordersApi }) => {
    const created: OrderResponse = await (
      await ordersApi.create(OrderRequestBuilder.aMarketOrder().withClientId('CLIENT_UI_CANCEL_OWNER').build())
    ).json();

    const result = await orderPage.cancelOrder({ orderId: created.orderId, clientId: 'CLIENT_UI_CANCEL_INTRUDER' });

    expect(result.code).toBe('FORBIDDEN');
  });
});
