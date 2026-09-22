import { test, expect } from '../../src/fixtures/fixtures';
import { OrderRequestBuilder } from '../../src/data/orderRequestBuilder';
import type { OrderResponse } from '../../src/types/order.types';

test.describe('API + UI — cross-channel consistency', () => {
  test('an order created via the API can be found and viewed through the UI', async ({ ordersApi, orderPage }) => {
    const created: OrderResponse = await (
      await ordersApi.create(
        OrderRequestBuilder.aLimitOrder().withClientId('CLIENT_XC_01').withSymbol('NFLX').withPrice(400.25).build(),
      )
    ).json();

    const result = await orderPage.getOrder({ orderId: created.orderId, clientId: 'CLIENT_XC_01' });

    expect(result.orderId).toBe(created.orderId);
    expect(result.symbol).toBe('NFLX');
    expect(result.price).toBe(400.25);
  });

  test('an order created via the UI can be independently confirmed via the API', async ({ orderPage, ordersApi }) => {
    const result = await orderPage.createOrder({
      clientId: 'CLIENT_XC_02',
      symbol: 'GOOG',
      side: 'BUY',
      orderType: 'LIMIT',
      quantity: '5',
      price: '150.00',
    });

    const response = await ordersApi.get(result.orderId, 'CLIENT_XC_02');

    expect(response.status()).toBe(200);
    const fetched: OrderResponse = await response.json();
    expect(fetched.symbol).toBe('GOOG');
    expect(fetched.price).toBe(150);
  });

  test('cancelling via the API is immediately reflected when cancelling again through the UI', async ({ ordersApi, orderPage }) => {
    const created: OrderResponse = await (
      await ordersApi.create(OrderRequestBuilder.aMarketOrder().withClientId('CLIENT_XC_03').build())
    ).json();
    await ordersApi.cancel(created.orderId, { queryClientId: 'CLIENT_XC_03' });

    const result = await orderPage.cancelOrder({ orderId: created.orderId, clientId: 'CLIENT_XC_03' });

    expect(result.code).toBe('ORDER_ALREADY_CANCELLED');
  });

  test('full lifecycle: create via UI, cancel via API, confirm CANCELLED via UI', async ({ orderPage, ordersApi }) => {
    const created = await orderPage.createOrder({
      clientId: 'CLIENT_XC_04',
      symbol: 'AMZN',
      side: 'SELL',
      orderType: 'MARKET',
      quantity: '3',
    });

    const cancelResponse = await ordersApi.cancel(created.orderId, { queryClientId: 'CLIENT_XC_04' });
    expect(cancelResponse.status()).toBe(200);

    const result = await orderPage.getOrder({ orderId: created.orderId, clientId: 'CLIENT_XC_04' });

    expect(result.status).toBe('CANCELLED');
  });

  test('client ownership is enforced the same way regardless of which channel created the order', async ({ ordersApi, orderPage }) => {
    const created: OrderResponse = await (
      await ordersApi.create(OrderRequestBuilder.aMarketOrder().withClientId('CLIENT_XC_OWNER').build())
    ).json();

    const getResult = await orderPage.getOrder({ orderId: created.orderId, clientId: 'CLIENT_XC_INTRUDER' });
    expect(getResult.code).toBe('FORBIDDEN');

    const cancelResult = await orderPage.cancelOrder({ orderId: created.orderId, clientId: 'CLIENT_XC_INTRUDER' });
    expect(cancelResult.code).toBe('FORBIDDEN');
  });
});
