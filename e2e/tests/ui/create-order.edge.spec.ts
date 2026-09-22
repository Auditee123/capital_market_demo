import { test, expect } from '../../src/fixtures/fixtures';

test.describe('Create order — UI — edge cases', () => {
  test('switching order type to MARKET disables and clears the price field', async ({ orderPage }) => {
    await orderPage.priceInput.fill('123.45');
    await orderPage.orderTypeSelect.selectOption('MARKET');

    await expect(orderPage.priceInput).toBeDisabled();
    await expect(orderPage.priceInput).toHaveValue('');
  });

  test('switching back to LIMIT re-enables the price field', async ({ orderPage }) => {
    await orderPage.orderTypeSelect.selectOption('MARKET');
    await orderPage.orderTypeSelect.selectOption('LIMIT');

    await expect(orderPage.priceInput).toBeEnabled();
  });
});
