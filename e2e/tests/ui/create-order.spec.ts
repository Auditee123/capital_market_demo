import { test, expect } from '../../src/fixtures/fixtures';

test.describe('Create order — UI — positive', () => {
  test('creating a valid LIMIT order shows NEW status and fills in the view form', async ({ orderPage }) => {
    const result = await orderPage.createOrder({
      clientId: 'CLIENT_UI_01',
      symbol: 'AAPL',
      side: 'BUY',
      orderType: 'LIMIT',
      quantity: '50',
      price: '100.00',
    });

    expect(result.status).toBe('NEW');
    expect(result.price).toBe(100);
    await expect(orderPage.viewOrderIdInput).toHaveValue(result.orderId);
    await expect(orderPage.viewClientIdInput).toHaveValue('CLIENT_UI_01');
  });

  test('creating a valid MARKET order shows a null price', async ({ orderPage }) => {
    const result = await orderPage.createOrder({
      clientId: 'CLIENT_UI_02',
      symbol: 'MSFT',
      side: 'SELL',
      orderType: 'MARKET',
      quantity: '10',
    });

    expect(result.status).toBe('NEW');
    expect(result.price).toBeNull();
  });
});

// Edge cases for this flow live in create-order.edge.spec.ts

test.describe('Create order — UI — negative', () => {
  test('does not submit the create form when required fields are left blank', async ({ orderPage }) => {
    await orderPage.clientIdInput.fill('');
    await orderPage.symbolInput.fill('');
    await orderPage.createOrderButton.click();

    // Native HTML5 required-field validation blocks the submit — no request
    // ever fires, so the result panel still shows its initial placeholder text.
    await expect(orderPage.resultPanel).toHaveText('No order loaded yet.');
    const isValid = await orderPage.clientIdInput.evaluate((el) => (el as HTMLInputElement).validity.valid);
    expect(isValid).toBe(false);
  });

  test('a LIMIT order with price 0 passes native validation but the server rejects it', async ({ orderPage }) => {
    const result = await orderPage.createOrder({
      clientId: 'CLIENT_UI_03',
      symbol: 'AAPL',
      orderType: 'LIMIT',
      quantity: '10',
      price: '0',
    });

    expect(result.code).toBe('VALIDATION_ERROR');
  });
});
