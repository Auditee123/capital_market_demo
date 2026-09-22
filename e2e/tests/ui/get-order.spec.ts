import { test, expect } from '../../src/fixtures/fixtures';
import { OrderRequestBuilder } from '../../src/data/orderRequestBuilder';
import type { OrderResponse } from '../../src/types/order.types';

test.describe('Get order — UI — positive', () => {
  test('looking up an order shows its full details', async ({ orderPage, ordersApi }) => {
    const created: OrderResponse = await (
      await ordersApi.create(OrderRequestBuilder.aLimitOrder().withClientId('CLIENT_UI_GET_01').withSymbol('TSLA').build())
    ).json();

    const result = await orderPage.getOrder({ orderId: created.orderId, clientId: 'CLIENT_UI_GET_01' });

    expect(result.symbol).toBe('TSLA');
    expect(result.status).toBe('NEW');
  });
});

test.describe('Get order — UI — negative', () => {
  test("looking up another client's order shows a FORBIDDEN error", async ({ orderPage, ordersApi }) => {
    const created: OrderResponse = await (
      await ordersApi.create(OrderRequestBuilder.aMarketOrder().withClientId('CLIENT_UI_OWNER').build())
    ).json();

    const result = await orderPage.getOrder({ orderId: created.orderId, clientId: 'CLIENT_UI_INTRUDER' });

    expect(result.code).toBe('FORBIDDEN');
  });

  test('looking up an order that does not exist shows an ORDER_NOT_FOUND error', async ({ orderPage }) => {
    const result = await orderPage.getOrder({ orderId: 'ORD-999999997', clientId: 'CLIENT001' });

    expect(result.code).toBe('ORDER_NOT_FOUND');
  });
});
